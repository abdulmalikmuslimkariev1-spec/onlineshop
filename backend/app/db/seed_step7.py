import asyncio
import sys
import os

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal as SessionLocal
from app.models.product import Category, Product, ProductImage
from sqlalchemy import select

async def seed_data():
    async with SessionLocal() as db:
        # Check if categories exist
        result = await db.execute(select(Category))
        if result.scalars().first():
            print("Categories already exist, skipping seed.")
            return

        # Add Categories
        electronics = Category(name="Elektronika", slug="elektronika", description="Smartfonlar, noutbuklar va boshqalar")
        clothing = Category(name="Kiyim-kechak", slug="kiyim-kechak", description="Erkaklar va ayollar kiyimlari")
        home = Category(name="Uy va bog'", slug="uy-bog", description="Uy uchun barcha narsalar")
        
        db.add_all([electronics, clothing, home])
        await db.flush()

        # Add Products
        p1 = Product(
            category_id=electronics.id,
            name="iPhone 15 Pro",
            slug="iphone-15-pro",
            description="Eng yangi va kuchli iPhone",
            sku="IPH15P",
            price=15000000.00,
            discount_price=14500000.00,
            stock_quantity=10,
            is_active=True
        )
        
        p2 = Product(
            category_id=electronics.id,
            name="MacBook Air M2",
            slug="macbook-air-m2",
            description="Yengil va samarali noutbuk",
            sku="MBAIR2",
            price=12000000.00,
            stock_quantity=5,
            is_active=True
        )

        p3 = Product(
            category_id=clothing.id,
            name="Erkaklar ko'ylagi",
            slug="mens-shirt",
            description="Sifatli paxtadan tikilgan",
            sku="MSHIRT1",
            price=250000.00,
            stock_quantity=50,
            is_active=True
        )

        db.add_all([p1, p2, p3])
        await db.flush()

        # Add Images
        img1 = ProductImage(product_id=p1.id, url="https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800", is_primary=True)
        img2 = ProductImage(product_id=p2.id, url="https://images.unsplash.com/photo-1611186871348-b1ec696e5239?w=800", is_primary=True)
        img3 = ProductImage(product_id=p3.id, url="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", is_primary=True)
        
        db.add_all([img1, img2, img3])
        
        await db.commit()
        print("Seed data created successfully.")

if __name__ == "__main__":
    asyncio.run(seed_data())
