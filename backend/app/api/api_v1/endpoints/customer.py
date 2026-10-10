from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
import random
import string
import re

from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.models.customer import Customer, Address
from app.models.product import Product, Category
from app.models.order import Order, OrderItem, OrderStatus, OrderStatusHistory
from app.core import security
from app.core.config import settings
from app.models.user import User, Role
from datetime import datetime, timedelta
from app.schemas.user import Token
from app.schemas.customer import (
    AddressSchema, AddressCreate, AddressUpdate,
    ProductSchema, CategorySchema,
    OrderCreate, OrderSchema,
    CustomerProfile, CustomerProfileUpdate,
    CustomerRegister, CustomerLogin
)
from app.api.api_v1.endpoints.admin import create_audit_log

router = APIRouter()

def normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone.strip())
    if len(digits) == 12 and digits.startswith("998"):
        digits = digits[3:]
    elif len(digits) == 10 and digits.startswith("8"):
        digits = digits[1:]
    elif len(digits) >= 9:
        digits = digits[-9:]
    return f"+998{digits}"

@router.post("/register", response_model=Token)
async def customer_register(
    reg_in: CustomerRegister,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Register a new customer account strictly using phone number and password.
    No email required or allowed.
    """
    full_name = reg_in.full_name.strip()
    if not full_name or len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Ism kamida 2 ta belgidan iborat bo'lishi kerak")

    clean_phone = normalize_phone(reg_in.phone)
    phone_digits = re.sub(r"\D", "", clean_phone)
    if len(phone_digits) < 9:
        raise HTTPException(status_code=400, detail="Telefon raqam noto'g'ri kiritildi")

    if len(reg_in.password) < 6:
        raise HTTPException(status_code=400, detail="Parol kamida 6 ta belgidan iborat bo'lishi kerak")

    if reg_in.password != reg_in.password_confirm:
        raise HTTPException(status_code=400, detail="Parollar bir xil emas")
        
    # Check if phone is already registered in Customer table
    existing_cust = (
        await db.execute(
            select(Customer).where(
                (Customer.phone == clean_phone) | (Customer.phone == reg_in.phone.strip())
            )
        )
    ).scalar_one_or_none()
    if existing_cust:
        raise HTTPException(status_code=400, detail="Bu telefon raqam allaqachon ro'yxatdan o'tgan")
        
    internal_email = f"c_{phone_digits}@customer.online.shop"
    existing_user = (await db.execute(select(User).where(User.email == internal_email))).scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu telefon raqam allaqachon ro'yxatdan o'tgan")
            
    # Find or create CUSTOMER role only
    role_res = await db.execute(select(Role).where(Role.name == "CUSTOMER"))
    customer_role = role_res.scalar_one_or_none()
    if not customer_role:
        customer_role = Role(name="CUSTOMER", description="Online Shop Customer")
        db.add(customer_role)
        await db.flush()
        
    user = User(
        email=internal_email,
        full_name=full_name,
        hashed_password=security.get_password_hash(reg_in.password),
        is_active=True,
        is_superuser=False, # STRICT: Customer is NEVER superuser
        roles=[customer_role] # STRICT: Customer ONLY gets CUSTOMER role
    )
    db.add(user)
    await db.flush()
    
    customer = Customer(
        user_id=user.id,
        phone=clean_phone
    )
    db.add(customer)
    await db.commit()
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/login", response_model=Token)
async def customer_login(
    login_in: CustomerLogin,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Customer login using phone number and password only.
    """
    clean_phone = normalize_phone(login_in.phone)
    raw_phone = login_in.phone.strip()
    
    res = await db.execute(
        select(Customer)
        .where((Customer.phone == clean_phone) | (Customer.phone == raw_phone))
        .options(selectinload(Customer.user).selectinload(User.roles))
    )
    customer = res.scalar_one_or_none()
    
    if not customer or not customer.user or not security.verify_password(login_in.password, customer.user.hashed_password):
        raise HTTPException(status_code=400, detail="Telefon raqam yoki parol noto'g'ri")
        
    if not customer.user.is_active:
        raise HTTPException(status_code=400, detail="Hisob faol emas")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            customer.user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

async def get_current_customer_record(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Customer:
    result = await db.execute(
        select(Customer).where(Customer.user_id == current_user.id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        # Create customer record if it doesn't exist for a regular user
        customer = Customer(user_id=current_user.id, phone="")
        db.add(customer)
        await db.commit()
        await db.refresh(customer)
    return customer

# --- Products & Categories ---

@router.get("/categories", response_model=List[CategorySchema])
async def get_categories(db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Category).where(Category.is_active == True))
    return result.scalars().all()

@router.get("/products", response_model=List[ProductSchema])
async def get_products(
    db: AsyncSession = Depends(get_db),
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
) -> Any:
    query = select(Product).where(Product.is_active == True).options(selectinload(Product.images), selectinload(Product.category))
    if category_id:
        query = query.where(Product.category_id == category_id)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/products/{slug}", response_model=ProductSchema)
async def get_product(slug: str, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(
        select(Product)
        .where(Product.slug == slug, Product.is_active == True)
        .options(selectinload(Product.images), selectinload(Product.category))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# --- Addresses ---

@router.get("/addresses", response_model=List[AddressSchema])
async def get_addresses(
    customer: Customer = Depends(get_current_customer_record),
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(Address).where(Address.customer_id == customer.id))
    return result.scalars().all()

@router.post("/addresses", response_model=AddressSchema)
async def create_address(
    address_in: AddressCreate,
    customer: Customer = Depends(get_current_customer_record),
    db: AsyncSession = Depends(get_db)
) -> Any:
    # If is_default is true, unset others
    if address_in.is_default:
        await db.execute(
            Address.__table__.update()
            .where(Address.customer_id == customer.id)
            .values(is_default=False)
        )
        
    address = Address(**address_in.model_dump(), customer_id=customer.id)
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address

@router.delete("/addresses/{address_id}")
async def delete_address(
    address_id: int,
    customer: Customer = Depends(get_current_customer_record),
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(
        select(Address).where(Address.id == address_id, Address.customer_id == customer.id)
    )
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    await db.delete(address)
    await db.commit()
    return {"status": "ok"}

@router.put("/addresses/{address_id}", response_model=AddressSchema)
async def update_address(
    address_id: int,
    address_in: AddressUpdate,
    customer: Customer = Depends(get_current_customer_record),
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(
        select(Address).where(Address.id == address_id, Address.customer_id == customer.id)
    )
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    
    update_data = address_in.model_dump(exclude_unset=True)
    if update_data.get("is_default"):
        await db.execute(
            Address.__table__.update()
            .where(Address.customer_id == customer.id)
            .values(is_default=False)
        )
    for field, value in update_data.items():
        setattr(address, field, value)
        
    await db.commit()
    await db.refresh(address)
    return address

# --- Orders ---

def generate_order_number():
    timestamp = datetime.utcnow().strftime("%y%m%d%H%M")
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ORD-{timestamp}-{suffix}"

async def build_order_response(order: Order, db: AsyncSession) -> dict:
    addr_res = await db.execute(select(Address).where(Address.id == order.address_id))
    addr = addr_res.scalar_one_or_none()
    address_data = None
    if addr:
        address_data = {
            "id": addr.id,
            "customer_id": addr.customer_id,
            "title": addr.title,
            "address_line": addr.address_line,
            "city": addr.city,
            "district": addr.district,
            "is_default": getattr(addr, "is_default", False),
            "latitude": addr.latitude,
            "longitude": addr.longitude,
        }

    product_ids = [item.product_id for item in order.items]
    products_map = {}
    if product_ids:
        p_res = await db.execute(
            select(Product)
            .where(Product.id.in_(product_ids))
            .options(selectinload(Product.images))
        )
        for p in p_res.scalars().all():
            products_map[p.id] = {
                "name": p.name,
                "image": p.images[0].url if p.images and len(p.images) > 0 else None
            }

    items_data = []
    for item in order.items:
        p_info = products_map.get(item.product_id, {})
        items_data.append({
            "id": item.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": float(item.unit_price),
            "discount": float(item.discount or 0),
            "subtotal": float(item.subtotal),
            "product_name": p_info.get("name", f"Mahsulot #{item.product_id}"),
            "product_image": p_info.get("image")
        })

    history_data = []
    for h in order.status_history:
        history_data.append({
            "id": h.id,
            "new_status": h.new_status,
            "note": h.note,
            "created_at": h.created_at
        })

    return {
        "id": order.id,
        "order_number": order.order_number,
        "subtotal": float(order.subtotal or 0),
        "delivery_fee": float(order.delivery_fee or 0),
        "discount": float(order.discount or 0),
        "total": float(order.total),
        "payment_method": order.payment_method or "CASH",
        "payment_status": order.payment_status or "PENDING",
        "status": order.status,
        "customer_note": order.customer_note,
        "address_id": order.address_id,
        "address": address_data,
        "created_at": order.created_at,
        "items": items_data,
        "status_history": history_data
    }

@router.post("/orders", response_model=OrderSchema)
async def create_order(
    order_in: OrderCreate,
    customer: Customer = Depends(get_current_customer_record),
    current_user: User = Depends(deps.verify_app_context),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Transactional order creation with strict server-side price recalculation.
    Cannot create order from empty cart.
    """
    if not order_in.items or len(order_in.items) == 0:
        raise HTTPException(status_code=400, detail="Savatchada mahsulot yo'q")

    # Validate address ownership
    addr_res = await db.execute(
        select(Address).where(Address.id == order_in.address_id, Address.customer_id == customer.id)
    )
    address = addr_res.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=400, detail="Tanlangan yetkazib berish manzili topilmadi")

    # Fetch products and recalculate prices strictly on server
    subtotal = 0.0
    items_to_create = []

    for item_in in order_in.items:
        if item_in.quantity <= 0:
            raise HTTPException(status_code=400, detail="Mahsulot miqdori 1 dan kam bo'lishi mumkin emas")

        prod_res = await db.execute(
            select(Product).where(Product.id == item_in.product_id, Product.is_active == True)
        )
        product = prod_res.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=400, detail=f"Mahsulot (ID: {item_in.product_id}) mavjud emas")

        unit_price = float(product.discount_price) if product.discount_price and product.discount_price > 0 else float(product.price)
        item_subtotal = round(unit_price * item_in.quantity, 2)
        subtotal += item_subtotal

        items_to_create.append({
            "product_id": product.id,
            "quantity": item_in.quantity,
            "unit_price": unit_price,
            "discount": 0.0,
            "subtotal": item_subtotal
        })

    delivery_fee = 0.0
    discount = 0.0
    total = round(subtotal + delivery_fee - discount, 2)

    # 100% Transactional database operations:
    order = Order(
        order_number=generate_order_number(),
        customer_id=customer.id,
        address_id=address.id,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        discount=discount,
        total=total,
        payment_method=order_in.payment_method or "CASH",
        payment_status="PENDING",
        status=OrderStatus.NEW,
        customer_note=order_in.customer_note
    )
    db.add(order)
    await db.flush()

    for item_data in items_to_create:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            discount=item_data["discount"],
            subtotal=item_data["subtotal"]
        )
        db.add(order_item)

    history = OrderStatusHistory(
        order_id=order.id,
        old_status=None,
        new_status=OrderStatus.NEW,
        changed_by=current_user.id,
        note="Buyurtma mijoz tomonidan joylashtirildi"
    )
    db.add(history)

    await create_audit_log(
        db, current_user.id, "ORDER_CREATED", "ORDER", str(order.id),
        {"total": total, "subtotal": subtotal, "items_count": len(items_to_create)}
    )

    await db.commit()

    # Reload with items and status history
    result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.items), selectinload(Order.status_history))
    )
    saved_order = result.scalar_one()
    return await build_order_response(saved_order, db)

@router.get("/orders", response_model=List[OrderSchema])
async def get_my_orders(
    customer: Customer = Depends(get_current_customer_record),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get all orders for the authenticated customer only.
    """
    result = await db.execute(
        select(Order)
        .where(Order.customer_id == customer.id)
        .order_by(Order.id.desc())
        .options(selectinload(Order.items), selectinload(Order.status_history))
    )
    orders = result.scalars().all()
    return [await build_order_response(o, db) for o in orders]

@router.get("/orders/{order_id}", response_model=OrderSchema)
async def get_order_details(
    order_id: int,
    customer: Customer = Depends(get_current_customer_record),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get order detail strictly scoped to authenticated customer.
    Access to another customer's order returns 404.
    """
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.customer_id == customer.id)
        .options(selectinload(Order.items), selectinload(Order.status_history))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    return await build_order_response(order, db)

# --- Profile ---

@router.get("/profile", response_model=CustomerProfile)
async def get_profile(
    customer: Customer = Depends(get_current_customer_record),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    return {
        "id": customer.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": customer.phone
    }

@router.patch("/profile", response_model=CustomerProfile)
async def update_profile(
    profile_in: CustomerProfileUpdate,
    customer: Customer = Depends(get_current_customer_record),
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.phone is not None:
        customer.phone = profile_in.phone
    
    await db.commit()
    return {
        "id": customer.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": customer.phone
    }
