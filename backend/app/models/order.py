from typing import List, Optional
from sqlalchemy import String, ForeignKey, Numeric, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base
import enum

class OrderStatus(str, enum.Enum):
    NEW = "NEW"
    CONFIRMED = "CONFIRMED"
    PREPARING = "PREPARING"
    READY_FOR_COURIER = "READY_FOR_COURIER"
    ASSIGNED = "ASSIGNED"
    ON_THE_WAY = "ON_THE_WAY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class Order(Base):
    id: Mapped[int] = mapped_column(primary_key=True)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))
    address_id: Mapped[int] = mapped_column(ForeignKey("address.id"))
    
    # Monetary values (Numeric)
    subtotal: Mapped[float] = mapped_column(Numeric(precision=12, scale=2))
    delivery_fee: Mapped[float] = mapped_column(Numeric(precision=12, scale=2), default=0)
    discount: Mapped[float] = mapped_column(Numeric(precision=12, scale=2), default=0)
    total: Mapped[float] = mapped_column(Numeric(precision=12, scale=2))
    
    payment_method: Mapped[str] = mapped_column(String(50)) # e.g. "CASH", "CARD"
    payment_status: Mapped[str] = mapped_column(String(50)) # e.g. "PENDING", "PAID"
    status: Mapped[OrderStatus] = mapped_column(SQLEnum(OrderStatus), default=OrderStatus.NEW)
    
    customer_note: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Assignments
    operator_id: Mapped[Optional[int]] = mapped_column(ForeignKey("user.id"), nullable=True)
    courier_id: Mapped[Optional[int]] = mapped_column(ForeignKey("courier.id"), nullable=True)

    customer: Mapped["Customer"] = relationship(back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    status_history: Mapped[List["OrderStatusHistory"]] = relationship(back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_item"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("order.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("product.id"))
    
    quantity: Mapped[int] = mapped_column(default=1)
    # Unit price at the time of order
    unit_price: Mapped[float] = mapped_column(Numeric(precision=12, scale=2))
    discount: Mapped[float] = mapped_column(Numeric(precision=12, scale=2), default=0)
    subtotal: Mapped[float] = mapped_column(Numeric(precision=12, scale=2))

    order: Mapped["Order"] = relationship(back_populates="items")

class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("order.id"))
    old_status: Mapped[Optional[OrderStatus]] = mapped_column(SQLEnum(OrderStatus), nullable=True)
    new_status: Mapped[OrderStatus] = mapped_column(SQLEnum(OrderStatus))
    changed_by: Mapped[int] = mapped_column(ForeignKey("user.id"))
    note: Mapped[str] = mapped_column(String(255), nullable=True)

    order: Mapped["Order"] = relationship(back_populates="status_history")
