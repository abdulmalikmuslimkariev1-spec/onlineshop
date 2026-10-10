from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.order import OrderStatus
from app.schemas.user import User

class OperatorDashboardStats(BaseModel):
    new_orders: int = 0
    processing_orders: int = 0
    ready_orders: int = 0
    today_total: int = 0

class OrderItemSchema(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    discount: float
    subtotal: float
    
    model_config = ConfigDict(from_attributes=True)

class OrderStatusHistorySchema(BaseModel):
    id: int
    old_status: Optional[OrderStatus]
    new_status: OrderStatus
    changed_by: int
    note: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class OrderSchema(BaseModel):
    id: int
    order_number: str
    customer_id: int
    address_id: int
    subtotal: float
    delivery_fee: float
    discount: float
    total: float
    payment_method: str
    payment_status: str
    status: OrderStatus
    customer_note: Optional[str]
    operator_id: Optional[int]
    courier_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    items: List[OrderItemSchema] = []
    status_history: List[OrderStatusHistorySchema] = []
    
    model_config = ConfigDict(from_attributes=True)

class OrderList(BaseModel):
    items: List[OrderSchema]
    total: int
    page: int
    page_size: int

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    note: Optional[str] = None
    courier_id: Optional[int] = None
