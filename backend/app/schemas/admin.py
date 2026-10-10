from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.schemas.user import User

class AdminDashboardStats(BaseModel):
    total_users: int = 0
    total_admins: int = 0
    total_operators: int = 0
    total_couriers: int = 0
    total_customers: int = 0
    total_products: int = 0
    total_orders: int = 0

class UserStatusUpdate(BaseModel):
    is_active: bool

class AdminCreate(BaseModel):
    full_name: str
    email: str
    password: str
    is_active: bool = True

class AdminUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordReset(BaseModel):
    new_password: str

class AuditLogSchema(BaseModel):
    id: int
    actor_id: Optional[int]
    action: str
    target_type: str
    target_id: Optional[str]
    timestamp: datetime
    metadata_json: Optional[dict[str, Any]]
    
    model_config = ConfigDict(from_attributes=True)

class UserList(BaseModel):
    items: List[User]
    total: int
    page: int
    page_size: int

class CategoryAdminBase(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True

class CategoryAdminCreate(CategoryAdminBase):
    pass

class CategoryAdminUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class CategoryAdminOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class ProductImageAdminOut(BaseModel):
    id: int
    url: str
    is_primary: bool
    sort_order: int = 0
    model_config = ConfigDict(from_attributes=True)

class ProductAdminCreate(BaseModel):
    name: str
    category_id: Optional[int] = None
    description: Optional[str] = None
    price: float
    discount_price: Optional[float] = None
    stock_quantity: int = 0
    sku: Optional[str] = None
    barcode: Optional[str] = None
    is_active: bool = True
    images: Optional[List[str]] = None

class ProductAdminUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    is_active: Optional[bool] = None
    images: Optional[List[str]] = None

class ProductAdminOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    price: float
    discount_price: Optional[float] = None
    stock_quantity: int
    is_active: bool
    category_id: Optional[int] = None
    category: Optional[CategoryAdminOut] = None
    images: List[ProductImageAdminOut] = []

    model_config = ConfigDict(from_attributes=True)

class ProductList(BaseModel):
    items: List[ProductAdminOut]
    total: int
    page: int
    page_size: int

class BrandingSettingsSchema(BaseModel):
    id: Optional[int] = None
    store_name: str
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    primary_color: str
    secondary_color: str
    website_title: Optional[str] = None
    short_description: Optional[str] = None
    telegram_link: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    currency: str
    default_lang: str

    model_config = ConfigDict(from_attributes=True)

class BannerBase(BaseModel):
    name: str
    image_url: str
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    product_id: Optional[int] = None
    category_id: Optional[int] = None
    sort_order: int = 0

class BannerCreate(BannerBase):
    pass

class BannerUpdate(BaseModel):
    name: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    product_id: Optional[int] = None
    category_id: Optional[int] = None
    sort_order: Optional[int] = None

class BannerProductOut(BaseModel):
    id: int
    name: str
    price: float
    discount_price: Optional[float] = None
    category_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class BannerOut(BannerBase):
    id: int
    product: Optional[BannerProductOut] = None
    category: Optional[CategoryAdminOut] = None

    model_config = ConfigDict(from_attributes=True)
