from typing import Any, List, Optional
from datetime import datetime, date
from decimal import Decimal
import re
import random
import string
from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile
import os
import shutil
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.api import deps
from app.core import security
from app.db.session import get_db
from app.models.user import User, Role
from app.models.product import Product, Category, ProductImage, Banner
from app.models.order import Order
from app.models.audit import AuditLog
from app.models.settings import BrandingSettings
from app.schemas.admin import (
    AdminDashboardStats, 
    UserList, 
    UserStatusUpdate, 
    AdminCreate, 
    AdminUpdate,
    PasswordReset,
    ProductAdminCreate,
    ProductAdminUpdate,
    ProductAdminOut,
    ProductList,
    CategoryAdminCreate,
    CategoryAdminUpdate,
    CategoryAdminOut,
    BrandingSettingsSchema,
    BannerCreate,
    BannerUpdate,
    BannerOut
)
from app.schemas.user import User as UserSchema

router = APIRouter()

def make_json_serializable(obj: Any) -> Any:
    if obj is None or isinstance(obj, (int, float, str, bool)):
        return obj
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {str(k): make_json_serializable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [make_json_serializable(item) for item in obj]
    if hasattr(obj, "model_dump"):
        return make_json_serializable(obj.model_dump())
    if hasattr(obj, "dict"):
        return make_json_serializable(obj.dict())
    return str(obj)

async def create_audit_log(
    db: AsyncSession, 
    actor_id: int, 
    action: str, 
    target_type: str, 
    target_id: str, 
    metadata: Optional[dict] = None
):
    safe_metadata = make_json_serializable(metadata) if metadata is not None else None
    audit = AuditLog(
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        metadata_json=safe_metadata
    )
    db.add(audit)
    await db.flush()

@router.get("/dashboard", response_model=AdminDashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Get high-level dashboard statistics.
    Available for both ADMIN and SUPERADMIN.
    """
    # Check if user has management access (ADMIN or SUPERADMIN)
    has_access = current_user.is_superuser or any(r.name in ["ADMIN", "SUPERADMIN"] for r in current_user.roles)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Counts
    user_count = await db.scalar(select(func.count(User.id)))
    product_count = await db.scalar(select(func.count(Product.id)))
    order_count = await db.scalar(select(func.count(Order.id)))
    
    # Specific roles
    async def get_role_count(role_name: str):
        return await db.scalar(
            select(func.count(User.id))
            .join(User.roles)
            .where(Role.name == role_name)
        )

    return {
        "total_users": user_count or 0,
        "total_admins": await get_role_count("ADMIN"),
        "total_operators": await get_role_count("OPERATOR"),
        "total_couriers": await get_role_count("COURIER"),
        "total_customers": await get_role_count("CUSTOMER"),
        "total_products": product_count or 0,
        "total_orders": order_count or 0
    }

@router.get("/users", response_model=UserList)
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None
) -> Any:
    """
    List and filter users.
    """
    # Authorization: Only Admin or Superadmin
    if not (current_user.is_superuser or any(r.name in ["ADMIN", "SUPERADMIN"] for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    query = select(User).options(selectinload(User.roles))
    
    # Filters
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )
    
    if role:
        query = query.join(User.roles).where(Role.name == role)
        
    if is_active is not None:
        query = query.where(User.is_active == is_active)

    # Count total
    total_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(total_query) or 0

    # Pagination
    query = query.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.patch("/users/{user_id}/status", response_model=UserSchema)
async def update_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Activate or deactivate a user.
    """
    if not (current_user.is_superuser or any(r.name in ["SUPERADMIN"] for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Only SUPERADMIN can change user status")

    result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.roles)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Protection against deactivating the last SUPERADMIN
    if user.is_superuser or any(r.name == "SUPERADMIN" for r in user.roles):
        if not status_update.is_active:
            # Check if there are other active superadmins
            sa_count = await db.scalar(
                select(func.count(User.id))
                .join(User.roles)
                .where(Role.name == "SUPERADMIN", User.is_active == True, User.id != user_id)
            )
            if sa_count == 0:
                raise HTTPException(status_code=400, detail="Cannot deactivate the last active SUPERADMIN")

    user.is_active = status_update.is_active
    
    await create_audit_log(
        db, current_user.id, 
        "USER_STATUS_UPDATED", "USER", str(user_id), 
        {"is_active": status_update.is_active}
    )
    
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/users/{user_id}", response_model=UserSchema)
async def get_user_detail(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Get detailed information about a user.
    """
    if not (current_user.is_superuser or any(r.name in ["SUPERADMIN", "ADMIN"] for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.roles)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    pwd_in: PasswordReset,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Reset a user's password. Only SUPERADMIN can do this.
    """
    if not (current_user.is_superuser or any(r.name == "SUPERADMIN" for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Only SUPERADMIN can reset passwords")

    result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.roles)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = security.get_password_hash(pwd_in.new_password)
    
    await create_audit_log(
        db, current_user.id,
        "USER_PASSWORD_RESET", "USER", str(user_id),
        metadata={"by": current_user.email}
    )
    
    await db.commit()
    return {"status": "success", "message": "Password reset successfully"}


@router.get("/settings/branding", response_model=BrandingSettingsSchema)
async def get_branding_settings(
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get centralized branding settings (public).
    """
    res = await db.execute(select(BrandingSettings))
    settings = res.scalar_one_or_none()
    if not settings:
        # Create default settings if not exists
        settings = BrandingSettings(
            store_name="Online Shop",
            website_title="Online Shop - Tezkor va sifatli xaridlar",
            short_description="Smartfonlar, poyabzallar va kiyimlar do'koni",
            primary_color="#0F172A",
            secondary_color="#334155",
            phone="+998901234567",
            email="support@online.shop",
            currency="UZS",
            default_lang="uz",
            logo_url="",
            favicon_url=""
        )
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.put("/settings/branding", response_model=BrandingSettingsSchema)
async def update_branding_settings(
    settings_in: BrandingSettingsSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Update central branding settings. Only SUPERADMIN can do this.
    """
    if not (current_user.is_superuser or any(r.name == "SUPERADMIN" for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Only SUPERADMIN can update settings")

    res = await db.execute(select(BrandingSettings))
    settings = res.scalar_one_or_none()
    if not settings:
        settings = BrandingSettings()
        db.add(settings)

    update_dict = settings_in.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        if k != "id":
            setattr(settings, k, v)

    await create_audit_log(
        db, current_user.id,
        "SETTINGS_UPDATED", "SETTINGS", str(settings.id or 1),
        metadata=update_dict
    )

    await db.commit()
    await db.refresh(settings)
    return settings

@router.post("/admins", response_model=UserSchema)
async def create_admin(
    admin_in: AdminCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Create a new ADMIN user. Only SUPERADMIN can do this.
    """
    if not (current_user.is_superuser or any(r.name == "SUPERADMIN" for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Only SUPERADMIN can create admins")

    # Check if user exists
    result = await db.execute(select(User).where(User.email == admin_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Get ADMIN role
    role_result = await db.execute(select(Role).where(Role.name == "ADMIN"))
    admin_role = role_result.scalar_one_or_none()
    if not admin_role:
        admin_role = Role(name="ADMIN", description="Administrator")
        db.add(admin_role)
        await db.flush()

    new_admin = User(
        email=admin_in.email,
        full_name=admin_in.full_name,
        hashed_password=security.get_password_hash(admin_in.password),
        is_active=admin_in.is_active,
        roles=[admin_role]
    )
    db.add(new_admin)
    await db.flush()
    
    await create_audit_log(
        db, current_user.id, 
        "ADMIN_CREATED", "USER", str(new_admin.id), 
        {"email": admin_in.email}
    )
    
    await db.commit()
    await db.refresh(new_admin)
    return new_admin

@router.post("/admins/{user_id}/reset-password")
async def reset_admin_password(
    user_id: int,
    password_in: PasswordReset,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Reset an admin's password. Only SUPERADMIN.
    """
    if not (current_user.is_superuser or any(r.name == "SUPERADMIN" for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Only SUPERADMIN can reset passwords")

    result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.roles)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = security.get_password_hash(password_in.new_password)
    
    await create_audit_log(
        db, current_user.id, 
        "ADMIN_PASSWORD_RESET", "USER", str(user_id)
    )
    
    await db.commit()
    return {"message": "Password reset successfully"}

# --- Catalog: Products & Categories Management ---

def format_category_admin(cat: Category) -> dict:
    return {
        "id": cat.id,
        "name": cat.name,
        "slug": cat.slug,
        "description": cat.description,
        "image_url": cat.image_url,
        "is_active": cat.is_active,
    }

def format_product_admin(prod: Product) -> dict:
    return {
        "id": prod.id,
        "name": prod.name,
        "slug": prod.slug,
        "description": prod.description,
        "sku": prod.sku,
        "barcode": prod.barcode,
        "price": float(prod.price) if prod.price is not None else 0.0,
        "discount_price": float(prod.discount_price) if prod.discount_price is not None else None,
        "stock_quantity": prod.stock_quantity or 0,
        "is_active": prod.is_active,
        "category_id": prod.category_id,
        "category": format_category_admin(prod.category) if prod.category else None,
        "images": [
            {
                "id": img.id,
                "url": img.url,
                "is_primary": img.is_primary,
                "sort_order": img.sort_order or 0,
            }
            for img in (prod.images or [])
        ],
    }

UPLOAD_DIR = "/app/applet/backend/uploads"

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Upload an image for a category, product, or banner.
    """
    has_access = current_user.is_superuser or any(r.name in ["ADMIN", "SUPERADMIN"] for r in current_user.roles)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    ext = os.path.splitext(file.filename or "")[1].lower()
    allowed_exts = [
        ".png", ".jpg", ".jpeg", ".jfif", ".pjp", ".pjpeg",
        ".webp", ".gif", ".svg", ".avif", ".heic", ".heif", ".bmp", ".ico", ".tiff"
    ]
    is_image = file.content_type and file.content_type.startswith("image/")

    if ext not in allowed_exts and not is_image:
        raise HTTPException(status_code=400, detail="Faqat rasm fayllari (JPG, PNG, WEBP, JFIF va b.) yuklash mumkin")

    if not ext or ext not in allowed_exts:
        ext = ".jpg"

    unique_filename = f"{uuid.uuid4()}{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/api/uploads/{unique_filename}"}

@router.get("/categories", response_model=List[CategoryAdminOut])
async def get_admin_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    List all categories for admin.
    """
    has_access = current_user.is_superuser or any(r.name in ["ADMIN", "SUPERADMIN"] for r in current_user.roles)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    res = await db.execute(select(Category).order_by(Category.id.asc()))
    categories = res.scalars().all()
    return [format_category_admin(c) for c in categories]

@router.post("/categories", response_model=CategoryAdminOut)
async def create_category(
    cat_in: CategoryAdminCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Create a new category.
    """
    has_access = current_user.is_superuser or any(r.name in ["ADMIN", "SUPERADMIN"] for r in current_user.roles)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    slug = cat_in.slug
    if not slug:
        slug = re.sub(r'[^a-zA-Z0-9]+', '-', cat_in.name.strip().lower()).strip('-')
        if not slug:
            slug = f"cat-{random.randint(1000, 9999)}"

    # Check unique slug
    existing = await db.scalar(select(Category).where(Category.slug == slug))
    if existing:
        slug = f"{slug}-{random.randint(100, 999)}"

    cat = Category(
        name=cat_in.name.strip(),
        slug=slug,
        description=cat_in.description,
        image_url=cat_in.image_url,
        is_active=cat_in.is_active
    )
    db.add(cat)
    await db.flush()

    await create_audit_log(
        db, current_user.id,
        "CATEGORY_CREATED", "CATEGORY", str(cat.id),
        metadata={"name": cat.name, "slug": cat.slug}
    )

    await db.commit()
    await db.refresh(cat)
    return format_category_admin(cat)

@router.put("/categories/{category_id}", response_model=CategoryAdminOut)
async def update_category(
    category_id: int,
    cat_in: CategoryAdminUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Update category details.
    """
    has_access = current_user.is_superuser or any(r.name in ["ADMIN", "SUPERADMIN"] for r in current_user.roles)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    cat = await db.scalar(select(Category).where(Category.id == category_id))
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    upd_data = cat_in.model_dump(exclude_unset=True)
    for field, val in upd_data.items():
        setattr(cat, field, val)

    await db.flush()

    await create_audit_log(
        db, current_user.id,
        "CATEGORY_UPDATED", "CATEGORY", str(cat.id),
        metadata={"name": cat.name, "is_active": cat.is_active}
    )

    await db.commit()
    await db.refresh(cat)
    return format_category_admin(cat)

@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Delete a category.
    """
    has_access = current_user.is_superuser or any(r.name in ["ADMIN", "SUPERADMIN"] for r in current_user.roles)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    cat = await db.scalar(select(Category).where(Category.id == category_id))
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    await db.delete(cat)
    await create_audit_log(
        db, current_user.id,
        "CATEGORY_DELETED", "CATEGORY", str(category_id),
        metadata={"name": cat.name}
    )
    await db.commit()
    return {"message": "Category deleted successfully"}

@router.get("/products", response_model=ProductList)
async def get_admin_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None
) -> Any:
    """
    List and filter products for admin management.
    """
    has_access = current_user.is_superuser or any(r.name in ["ADMIN", "SUPERADMIN"] for r in current_user.roles)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    query = select(Product).options(selectinload(Product.images), selectinload(Product.category))

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Product.name.ilike(search_term),
                Product.sku.ilike(search_term),
                Product.slug.ilike(search_term)
            )
        )

    if category_id:
        query = query.where(Product.category_id == category_id)

    if is_active is not None:
        query = query.where(Product.is_active == is_active)

    total_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(total_query) or 0

    query = query.order_by(Product.id.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    products = result.scalars().all()

    return {
        "items": [format_product_admin(p) for p in products],
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/products/{product_id}", response_model=ProductAdminOut)
async def get_admin_product_detail(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Get detailed product info by ID.
    """
    has_access = current_user.is_superuser or any(r.name in ["ADMIN", "SUPERADMIN"] for r in current_user.roles)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    res = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.images), selectinload(Product.category))
    )
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return format_product_admin(product)

@router.post("/products", response_model=ProductAdminOut)
async def create_product(
    prod_in: ProductAdminCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Create a new product.
    """
    has_access = current_user.is_superuser or any(r.name in ["ADMIN", "SUPERADMIN"] for r in current_user.roles)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    slug = re.sub(r'[^a-zA-Z0-9]+', '-', prod_in.name.strip().lower()).strip('-')
    if not slug:
        slug = f"prod-{random.randint(10000, 99999)}"

    existing = await db.scalar(select(Product).where(Product.slug == slug))
    if existing:
        slug = f"{slug}-{random.randint(100, 999)}"

    sku = prod_in.sku
    if not sku:
        sku = f"SKU-{random.randint(100000, 999999)}"

    clean_price = float(prod_in.price)
    clean_discount = float(prod_in.discount_price) if prod_in.discount_price is not None else None

    product = Product(
        name=prod_in.name.strip(),
        slug=slug,
        sku=sku,
        barcode=prod_in.barcode,
        description=prod_in.description,
        price=clean_price,
        discount_price=clean_discount,
        stock_quantity=prod_in.stock_quantity or 0,
        category_id=prod_in.category_id,
        is_active=prod_in.is_active
    )
    db.add(product)
    await db.flush()

    if prod_in.images:
        for idx, img_url in enumerate(prod_in.images):
            if img_url and str(img_url).strip():
                product.images.append(ProductImage(
                    url=str(img_url).strip(),
                    is_primary=(idx == 0),
                    sort_order=idx
                ))
        await db.flush()

    await create_audit_log(
        db, current_user.id,
        "PRODUCT_CREATED", "PRODUCT", str(product.id),
        metadata={
            "name": product.name,
            "price": clean_price,
            "sku": product.sku
        }
    )

    await db.commit()

    res = await db.execute(
        select(Product)
        .where(Product.id == product.id)
        .options(selectinload(Product.images), selectinload(Product.category))
    )
    product = res.scalar_one()
    return format_product_admin(product)

@router.put("/products/{product_id}", response_model=ProductAdminOut)
async def update_product(
    product_id: int,
    product_in: ProductAdminUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Update an existing product with safe numeric/decimal serialization.
    """
    has_access = current_user.is_superuser or any(r.name in ["ADMIN", "SUPERADMIN"] for r in current_user.roles)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    res = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.images), selectinload(Product.category))
    )
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_dict = product_in.model_dump(exclude_unset=True)

    if "images" in update_dict:
        images_list = update_dict.pop("images")
        if images_list is not None:
            product.images.clear()
            for idx, img_url in enumerate(images_list):
                if img_url and str(img_url).strip():
                    product.images.append(ProductImage(
                        url=str(img_url).strip(),
                        is_primary=(idx == 0),
                        sort_order=idx
                    ))

    for field, val in update_dict.items():
        if field in ("price", "discount_price") and val is not None:
            val = float(val)
        setattr(product, field, val)

    await db.flush()

    await create_audit_log(
        db, current_user.id,
        "PRODUCT_UPDATED", "PRODUCT", str(product.id),
        metadata={
            "name": product.name,
            "price": float(product.price) if product.price is not None else None,
            "discount_price": float(product.discount_price) if product.discount_price is not None else None,
            "stock_quantity": int(product.stock_quantity) if product.stock_quantity is not None else 0,
            "is_active": bool(product.is_active)
        }
    )

    await db.commit()

    res = await db.execute(
        select(Product)
        .where(Product.id == product.id)
        .options(selectinload(Product.images), selectinload(Product.category))
    )
    product = res.scalar_one()
    return format_product_admin(product)

@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Delete a product.
    """
    has_access = current_user.is_superuser or any(r.name in ["ADMIN", "SUPERADMIN"] for r in current_user.roles)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    res = await db.execute(select(Product).where(Product.id == product_id))
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.delete(product)
    await create_audit_log(
        db, current_user.id,
        "PRODUCT_DELETED", "PRODUCT", str(product_id),
        metadata={"name": product.name}
    )
    await db.commit()
    return {"message": "Product deleted successfully"}


# --- Banner Endpoints ---

@router.get("/banners", response_model=List[BannerOut])
async def get_active_banners(
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get all active and valid banners for customer storefront.
    """
    now = datetime.utcnow()
    query = (
        select(Banner)
        .where(Banner.is_active == True)
        .options(selectinload(Banner.product), selectinload(Banner.category))
    )
    res = await db.execute(query)
    banners = res.scalars().all()
    
    # Filter by date on python side to be DB agnostic & safe
    valid_banners = []
    for b in banners:
        start_valid = b.start_date is None or b.start_date <= now
        end_valid = b.end_date is None or b.end_date >= now
        if start_valid and end_valid:
            valid_banners.append(b)
            
    # Sort valid_banners by sort_order
    valid_banners.sort(key=lambda x: x.sort_order)
    return valid_banners


@router.get("/banners/all", response_model=List[BannerOut])
async def get_all_banners_admin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Get all banners (for admin list, including inactive and expired).
    """
    has_access = current_user.is_superuser or any(r.name in ["ADMIN", "SUPERADMIN"] for r in current_user.roles)
    if not has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    query = select(Banner).options(selectinload(Banner.product), selectinload(Banner.category)).order_by(Banner.sort_order)
    res = await db.execute(query)
    return res.scalars().all()


@router.post("/banners", response_model=BannerOut)
async def create_banner(
    banner_in: BannerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Create a new advertisement banner. Only SUPERADMIN can do this.
    """
    if not (current_user.is_superuser or any(r.name == "SUPERADMIN" for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Only SUPERADMIN can manage banners")

    banner = Banner(
        name=banner_in.name,
        image_url=banner_in.image_url,
        is_active=banner_in.is_active,
        start_date=banner_in.start_date,
        end_date=banner_in.end_date,
        product_id=banner_in.product_id,
        category_id=banner_in.category_id,
        sort_order=banner_in.sort_order
    )
    db.add(banner)
    await db.flush()

    await create_audit_log(
        db, current_user.id,
        "BANNER_CREATED", "BANNER", str(banner.id),
        metadata={"name": banner.name}
    )
    await db.commit()
    
    # Reload with relations
    res = await db.execute(
        select(Banner)
        .where(Banner.id == banner.id)
        .options(selectinload(Banner.product), selectinload(Banner.category))
    )
    return res.scalar_one()


@router.put("/banners/{banner_id}", response_model=BannerOut)
async def update_banner(
    banner_id: int,
    banner_in: BannerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Update a banner. Only SUPERADMIN can do this.
    """
    if not (current_user.is_superuser or any(r.name == "SUPERADMIN" for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Only SUPERADMIN can manage banners")

    res = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = res.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    update_dict = banner_in.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(banner, k, v)

    await create_audit_log(
        db, current_user.id,
        "BANNER_UPDATED", "BANNER", str(banner_id),
        metadata=update_dict
    )
    await db.commit()

    # Reload with relations
    res = await db.execute(
        select(Banner)
        .where(Banner.id == banner.id)
        .options(selectinload(Banner.product), selectinload(Banner.category))
    )
    return res.scalar_one()


@router.delete("/banners/{banner_id}")
async def delete_banner(
    banner_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.verify_app_context)
) -> Any:
    """
    Delete a banner. Only SUPERADMIN can do this.
    """
    if not (current_user.is_superuser or any(r.name == "SUPERADMIN" for r in current_user.roles)):
        raise HTTPException(status_code=403, detail="Only SUPERADMIN can manage banners")

    res = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = res.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    await db.delete(banner)
    await create_audit_log(
        db, current_user.id,
        "BANNER_DELETED", "BANNER", str(banner_id),
        metadata={"name": banner.name}
    )
    await db.commit()
    return {"message": "Banner deleted successfully"}
