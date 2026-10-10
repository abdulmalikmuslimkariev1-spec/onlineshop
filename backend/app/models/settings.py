from sqlalchemy import String, ForeignKey, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Courier(Base):
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), unique=True)
    vehicle_type: Mapped[str] = mapped_column(String(50), nullable=True) # e.g. "Bicycle", "Car"
    license_plate: Mapped[str] = mapped_column(String(20), nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    
    user: Mapped["User"] = relationship(back_populates="courier")

class StoreSettings(Base):
    __tablename__ = "store_settings"
    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    value: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

class BrandingSettings(Base):
    __tablename__ = "branding_settings"
    id: Mapped[int] = mapped_column(primary_key=True)
    store_name: Mapped[str] = mapped_column(String(100))
    logo_url: Mapped[str] = mapped_column(String(511), nullable=True)
    favicon_url: Mapped[str] = mapped_column(String(511), nullable=True)
    primary_color: Mapped[str] = mapped_column(String(20), default="#0F172A")
    secondary_color: Mapped[str] = mapped_column(String(20), default="#334155")
    website_title: Mapped[str] = mapped_column(String(255), nullable=True)
    short_description: Mapped[str] = mapped_column(Text, nullable=True)
    telegram_link: Mapped[str] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    email: Mapped[str] = mapped_column(String(100), nullable=True)
    currency: Mapped[str] = mapped_column(String(20), default="UZS")
    default_lang: Mapped[str] = mapped_column(String(10), default="uz")
