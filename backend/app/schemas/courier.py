from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.order import OrderStatus
from app.schemas.operator import OrderSchema

class CourierDashboardStats(BaseModel):
    assigned_orders: int = 0
    in_delivery_orders: int = 0
    completed_today: int = 0

class CourierProfile(BaseModel):
    id: int
    user_id: int
    vehicle_type: Optional[str]
    license_plate: Optional[str]
    is_available: bool
    
    model_config = ConfigDict(from_attributes=True)

class CourierOrderList(BaseModel):
    items: List[OrderSchema]
    total: int
    page: int
    page_size: int

class CourierStatusUpdate(BaseModel):
    status: OrderStatus
    note: Optional[str] = None
