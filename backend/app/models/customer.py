from typing import List, Optional
from sqlalchemy import String, ForeignKey, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Customer(Base):
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), unique=True)
    phone: Mapped[str] = mapped_column(String(20), index=True)
    
    user: Mapped["User"] = relationship(back_populates="customer")
    addresses: Mapped[List["Address"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship(back_populates="customer")

class Address(Base):
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(100)) # e.g. "Uy", "Ish"
    address_line: Mapped[str] = mapped_column(String(511))
    city: Mapped[str] = mapped_column(String(100))
    district: Mapped[str] = mapped_column(String(100), nullable=True)
    
    # Optional coordinates
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    delivery_note: Mapped[str] = mapped_column(String(255), nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    customer: Mapped["Customer"] = relationship(back_populates="addresses")
