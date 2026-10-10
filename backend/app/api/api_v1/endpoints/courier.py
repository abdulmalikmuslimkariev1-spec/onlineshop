from typing import Any, List, Optional
from datetime import datetime, date, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.models.settings import Courier
from app.models.order import Order, OrderStatus, OrderStatusHistory
from app.schemas.courier import (
    CourierDashboardStats,
    CourierOrderList,
    CourierStatusUpdate,
    CourierProfile
)
from app.schemas.operator import OrderSchema
from app.api.api_v1.endpoints.admin import create_audit_log

router = APIRouter()

async def get_current_courier(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Courier:
    # Explicit role check
    if not (current_user.is_superuser or any(r.name in ["COURIER", "ADMIN", "SUPERADMIN"] for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    result = await db.execute(select(Courier).where(Courier.user_id == current_user.id))
    courier = result.scalar_one_or_none()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier profile not found")
    return courier

@router.get("/dashboard", response_model=CourierDashboardStats)
async def get_courier_dashboard(
    db: AsyncSession = Depends(get_db),
    courier: Courier = Depends(get_current_courier),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Get courier dashboard statistics.
    """
    # assigned_orders: ASSIGNED
    assigned = await db.scalar(
        select(func.count(Order.id))
        .where(Order.courier_id == courier.id, Order.status == OrderStatus.ASSIGNED)
    )
    
    # in_delivery_orders: ON_THE_WAY
    in_delivery = await db.scalar(
        select(func.count(Order.id))
        .where(Order.courier_id == courier.id, Order.status == OrderStatus.ON_THE_WAY)
    )
    
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    completed_today = await db.scalar(
        select(func.count(Order.id))
        .where(
            Order.courier_id == courier.id, 
            Order.status == OrderStatus.DELIVERED,
            Order.updated_at >= today_start
        )
    )

    return {
        "assigned_orders": assigned or 0,
        "in_delivery_orders": in_delivery or 0,
        "completed_today": completed_today or 0
    }

@router.get("/orders", response_model=CourierOrderList)
async def get_courier_orders(
    db: AsyncSession = Depends(get_db),
    courier: Courier = Depends(get_current_courier),
    current_user: User = Depends(deps.verify_app_context),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[OrderStatus] = None
) -> Any:
    """
    List orders assigned to the courier.
    """
    query = select(Order).where(Order.courier_id == courier.id)
    
    if status_filter:
        query = query.where(Order.status == status_filter)
    
    # Count total
    total_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(total_query) or 0

    # Pagination
    query = query.order_by(Order.id.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query.options(
        selectinload(Order.items),
        selectinload(Order.status_history)
    ))
    orders = result.scalars().all()

    return {
        "items": orders,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/orders/{order_id}", response_model=OrderSchema)
async def get_courier_order_details(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    courier: Courier = Depends(get_current_courier),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Get details for an assigned order.
    """
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.courier_id == courier.id)
        .options(
            selectinload(Order.items),
            selectinload(Order.status_history)
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or not assigned to you")
    
    return order

@router.patch("/orders/{order_id}/status", response_model=OrderSchema)
async def update_delivery_status(
    order_id: int,
    status_update: CourierStatusUpdate,
    db: AsyncSession = Depends(get_db),
    courier: Courier = Depends(get_current_courier),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Update delivery status for an assigned order.
    """
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.courier_id == courier.id)
        .options(selectinload(Order.status_history))
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or not assigned to you")

    # Courier status transitions
    # READY_FOR_COURIER -> ASSIGNED (They can pick it up if they are already assigned, or if they take it)
    # Actually, in our current model, it's assigned to them by operator.
    # So it starts at ASSIGNED for them.
    # ASSIGNED -> ON_THE_WAY
    # ON_THE_WAY -> DELIVERED
    
    allowed_transitions = {
        OrderStatus.ASSIGNED: [OrderStatus.ON_THE_WAY, OrderStatus.CANCELLED],
        OrderStatus.ON_THE_WAY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    }
    
    # Special case: Pickup if it's already assigned to them but still in READY_FOR_COURIER
    if order.status == OrderStatus.READY_FOR_COURIER:
        if status_update.status != OrderStatus.ASSIGNED:
            raise HTTPException(status_code=400, detail="Must mark as ASSIGNED first")
    elif order.status not in allowed_transitions or status_update.status not in allowed_transitions[order.status]:
        raise HTTPException(
            status_code=400, 
            detail=f"Status transition from {order.status} to {status_update.status} not allowed for Courier"
        )

    old_status = order.status
    order.status = status_update.status
    
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
        "DELIVERY_STATUS_CHANGED", "ORDER", str(order_id),
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

@router.get("/profile", response_model=CourierProfile)
async def get_courier_profile(
    courier: Courier = Depends(get_current_courier),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    return courier
