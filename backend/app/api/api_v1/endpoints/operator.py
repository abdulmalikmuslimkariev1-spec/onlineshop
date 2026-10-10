from typing import Any, List, Optional
from datetime import datetime, date, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.api import deps
from app.db.session import get_db
from app.models.user import User, Role
from app.models.settings import Courier
from app.models.order import Order, OrderStatus, OrderStatusHistory
from app.schemas.operator import (
    OperatorDashboardStats,
    OrderList,
    OrderSchema,
    OrderStatusUpdate
)
from app.api.api_v1.endpoints.admin import create_audit_log

router = APIRouter()

@router.get("/dashboard", response_model=OperatorDashboardStats)
async def get_operator_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Get operator dashboard statistics.
    """
    # Verify OPERATOR role
    if not (current_user.is_superuser or any(r.name in ["OPERATOR", "ADMIN", "SUPERADMIN"] for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    
    new_orders = await db.scalar(select(func.count(Order.id)).where(Order.status == OrderStatus.NEW))
    processing = await db.scalar(select(func.count(Order.id)).where(Order.status == OrderStatus.PREPARING))
    ready = await db.scalar(select(func.count(Order.id)).where(Order.status == OrderStatus.READY_FOR_COURIER))
    today_total = await db.scalar(select(func.count(Order.id)).where(Order.created_at >= today_start))

    return {
        "new_orders": new_orders or 0,
        "processing_orders": processing or 0,
        "ready_orders": ready or 0,
        "today_total": today_total or 0
    }

@router.get("/orders", response_model=OrderList)
async def get_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[OrderStatus] = None,
    search: Optional[str] = None
) -> Any:
    """
    List and filter orders.
    """
    if not (current_user.is_superuser or any(r.name in ["OPERATOR", "ADMIN", "SUPERADMIN"] for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    query = select(Order).options(
        selectinload(Order.items),
        selectinload(Order.status_history)
    )

    if status_filter:
        query = query.where(Order.status == status_filter)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(Order.order_number.ilike(search_term))

    # Count total
    total_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(total_query) or 0

    # Pagination
    query = query.order_by(Order.id.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    orders = result.scalars().all()

    return {
        "items": orders,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/orders/{order_id}", response_model=OrderSchema)
async def get_order_details(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Get detailed order information.
    """
    if not (current_user.is_superuser or any(r.name in ["OPERATOR", "ADMIN", "SUPERADMIN"] for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items),
            selectinload(Order.status_history)
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

@router.patch("/orders/{order_id}/status", response_model=OrderSchema)
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Update order status and record history.
    """
    if not (current_user.is_superuser or any(r.name in ["OPERATOR", "ADMIN", "SUPERADMIN"] for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.status_history))
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Status transition validation logic for Operator
    allowed_transitions = {
        OrderStatus.NEW: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        OrderStatus.CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
        OrderStatus.PREPARING: [OrderStatus.READY_FOR_COURIER, OrderStatus.CANCELLED],
        OrderStatus.READY_FOR_COURIER: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
    }
    
    # Operators are generally responsible for initial processing
    # If a role is just OPERATOR, restrict transitions
    is_only_operator = not current_user.is_superuser and all(r.name == "OPERATOR" for r in current_user.roles)
    
    if is_only_operator:
        if order.status not in allowed_transitions or status_update.status not in allowed_transitions[order.status]:
            raise HTTPException(
                status_code=400, 
                detail=f"Status transition from {order.status} to {status_update.status} not allowed for Operator"
            )

    old_status = order.status
    order.status = status_update.status
    if status_update.courier_id:
        order.courier_id = status_update.courier_id
    
    # Add to history
    history = OrderStatusHistory(
        order_id=order.id,
        old_status=old_status,
        new_status=status_update.status,
        changed_by=current_user.id,
        note=status_update.note
    )
    db.add(history)
    
    # Audit log
    await create_audit_log(
        db, current_user.id,
        "ORDER_STATUS_CHANGED", "ORDER", str(order_id),
        {"old": old_status, "new": status_update.status}
    )
    
    await db.commit()
    await db.refresh(order)
    
    # Re-fetch with all relations
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items),
            selectinload(Order.status_history)
        )
    )
    return result.scalar_one()

@router.get("/couriers")
async def get_couriers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    if not (current_user.is_superuser or any(r.name in ["OPERATOR", "ADMIN", "SUPERADMIN"] for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    result = await db.execute(
        select(Courier).where(Courier.is_available == True).options(selectinload(Courier.user))
    )
    couriers = result.scalars().all()
    return [
        {
            "id": c.id,
            "user_id": c.user_id,
            "name": c.user.full_name if c.user and c.user.full_name else (c.user.email if c.user else f"Kuryer #{c.id}"),
            "vehicle_type": c.vehicle_type,
            "license_plate": c.license_plate
        }
        for c in couriers
    ]
