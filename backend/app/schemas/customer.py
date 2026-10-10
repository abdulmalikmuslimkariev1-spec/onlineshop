from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.order import OrderStatus

class AddressBase(BaseModel):
    title: str
    address_line: str
    city: str
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    delivery_note: Optional[str] = None
    is_default: bool = False

class AddressCreate(AddressBase):
    pass

class AddressUpdate(AddressBase):
    title: Optional[str] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    is_default: Optional[bool] = None

class AddressSchema(AddressBase):
    id: int
    customer_id: int
    
    model_config = ConfigDict(from_attributes=True)

class ProductImageSchema(BaseModel):
    url: str
    is_primary: bool
    model_config = ConfigDict(from_attributes=True)

class CategorySchema(BaseModel):
    id: int
    name: str
    slug: str
    image_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ProductSchema(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    discount_price: Optional[float] = None
    stock_quantity: int
    category_id: Optional[int] = None
    category: Optional[CategorySchema] = None
    images: List[ProductImageSchema] = []
    
    model_config = ConfigDict(from_attributes=True)

class CartItemIn(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    address_id: int
    payment_method: str = "CASH"
    customer_note: Optional[str] = None
    items: List[CartItemIn]

class OrderItemSchema(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    discount: Optional[float] = 0.0
    subtotal: float
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class OrderStatusHistorySchema(BaseModel):
    id: int
    new_status: OrderStatus
    note: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class OrderSchema(BaseModel):
    id: int
    order_number: str
    subtotal: Optional[float] = 0.0
    delivery_fee: Optional[float] = 0.0
    discount: Optional[float] = 0.0
    total: float
    payment_method: Optional[str] = "CASH"
    payment_status: Optional[str] = "PENDING"
    status: OrderStatus
    customer_note: Optional[str] = None
    address_id: Optional[int] = None
    address: Optional[AddressSchema] = None
    created_at: datetime
    items: List[OrderItemSchema] = []
    status_history: List[OrderStatusHistorySchema] = []
    
    model_config = ConfigDict(from_attributes=True)

class CustomerProfile(BaseModel):
    id: int
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class CustomerProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

class CustomerRegister(BaseModel):
    full_name: str
    phone: str
    password: str
    password_confirm: str

class CustomerLogin(BaseModel):
    phone: str
    password: str
