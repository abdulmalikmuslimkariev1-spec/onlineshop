import asyncio
from sqlalchemy import select, inspect, text
from sqlalchemy.orm import selectinload

from app.db.base import Base
from app.db.session import engine, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, Role
from app.models.product import Category, Product, ProductImage, Banner
from app.models.customer import Customer, Address
from app.models.settings import Courier, StoreSettings, BrandingSettings

def migrate_missing_columns(sync_conn):
    inspector = inspect(sync_conn)
    for table_name, table in Base.metadata.tables.items():
        if inspector.has_table(table_name):
            existing_cols = {c['name'] for c in inspector.get_columns(table_name)}
            for column in table.columns:
                if column.name not in existing_cols:
                    col_type = column.type.compile(sync_conn.dialect)
                    default_str = ""
                    if column.default is not None and hasattr(column.default, 'arg') and column.default.arg is not None:
                        if isinstance(column.default.arg, str):
                            default_str = f" DEFAULT '{column.default.arg}'"
                        elif isinstance(column.default.arg, (int, float, bool)):
                            default_str = f" DEFAULT {column.default.arg}"
                    
                    sql = f'ALTER TABLE "{table_name}" ADD COLUMN "{column.name}" {col_type}{default_str}'
                    print(f"Auto-migrating DB schema: {sql}")
                    sync_conn.execute(text(sql))

async def init_db():
    # 1. Create all tables if they don't exist and auto-migrate missing columns
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(migrate_missing_columns)
        
    async with AsyncSessionLocal() as db:
        # 2. Seed Roles
        roles_to_create = [
            ("SUPERADMIN", "Super Administrator"),
            ("ADMIN", "Administrator"),
            ("OPERATOR", "Order Operator"),
            ("COURIER", "Delivery Courier"),
            ("CUSTOMER", "Online Shop Customer"),
        ]
        
        roles_map = {}
        for role_name, role_desc in roles_to_create:
            res = await db.execute(select(Role).where(Role.name == role_name))
            role = res.scalar_one_or_none()
            if not role:
                role = Role(name=role_name, description=role_desc)
                db.add(role)
                await db.flush()
            roles_map[role_name] = role

        # 3. Seed Users
        # Superadmin
        res = await db.execute(select(User).options(selectinload(User.roles)).where(User.email == "admin@online.shop"))
        admin_user = res.scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                email="admin@online.shop",
                hashed_password=get_password_hash("admin123"),
                full_name="Bosh Admin",
                is_active=True,
                is_superuser=True,
                roles=[roles_map["SUPERADMIN"]]
            )
            db.add(admin_user)
            await db.flush()

        # Operator
        res = await db.execute(select(User).options(selectinload(User.roles)).where(User.email == "operator@online.shop"))
        operator_user = res.scalar_one_or_none()
        if not operator_user:
            operator_user = User(
                email="operator@online.shop",
                hashed_password=get_password_hash("operator123"),
                full_name="Bosh Operator",
                is_active=True,
                is_superuser=False,
                roles=[roles_map["OPERATOR"]]
            )
            db.add(operator_user)
            await db.flush()

        # Courier
        res = await db.execute(select(User).options(selectinload(User.roles)).where(User.email == "courier@online.shop"))
        courier_user = res.scalar_one_or_none()
        if not courier_user:
            courier_user = User(
                email="courier@online.shop",
                hashed_password=get_password_hash("courier123"),
                full_name="Kuryer Sardor",
                is_active=True,
                is_superuser=False,
                roles=[roles_map["COURIER"]]
            )
            db.add(courier_user)
            await db.flush()

        # Courier profile record
        res = await db.execute(select(Courier).where(Courier.user_id == courier_user.id))
        courier_record = res.scalar_one_or_none()
        if not courier_record:
            courier_record = Courier(
                user_id=courier_user.id,
                vehicle_type="Scooter",
                license_plate="01 A 777 AA",
                is_available=True
            )
            db.add(courier_record)
            await db.flush()

        # Customer
        res = await db.execute(select(User).options(selectinload(User.roles)).where(User.email == "customer@online.shop"))
        customer_user = res.scalar_one_or_none()
        if not customer_user:
            customer_user = User(
                email="customer@online.shop",
                hashed_password=get_password_hash("customer123"),
                full_name="Alisher Navoiy",
                is_active=True,
                is_superuser=False,
                roles=[roles_map["CUSTOMER"]]
            )
            db.add(customer_user)
            await db.flush()

        # Customer profile record
        res = await db.execute(select(Customer).where(Customer.user_id == customer_user.id))
        customer_record = res.scalar_one_or_none()
        if not customer_record:
            customer_record = Customer(
                user_id=customer_user.id,
                phone="+998991234567"
            )
            db.add(customer_record)
            await db.flush()

        # Default Customer Address
        res = await db.execute(select(Address).where(Address.customer_id == customer_record.id))
        address = res.scalar_one_or_none()
        if not address:
            address = Address(
                customer_id=customer_record.id,
                title="Uy",
                address_line="Amir Temur shoh ko'chasi, 45-uy",
                city="Toshkent",
                is_default=True
            )
            db.add(address)
            await db.flush()

        # 4. Seed Categories
        cat_data = [
            ("Smartfonlar", "smartfonlar", "Eng yangi va zamonaviy smartfonlar"),
            ("Kiyim-kechak", "kiyim-kechak", "Sifatli va qulay kiyimlar"),
            ("Poyabzallar", "poyabzallar", "Sport va kundalik poyabzallar"),
            ("Elektronika", "elektronika", "Noutbuklar, planshetlar va texnika"),
        ]
        
        categories_map = {}
        for c_name, c_slug, c_desc in cat_data:
            res = await db.execute(select(Category).where(Category.slug == c_slug))
            cat = res.scalar_one_or_none()
            if not cat:
                cat = Category(name=c_name, slug=c_slug, description=c_desc, is_active=True)
                db.add(cat)
                await db.flush()
            categories_map[c_slug] = cat

        # 5. Seed Products
        products_to_seed = [
            {
                "name": "Simsiz quloqchinlar",
                "slug": "simsiz-quloqchinlar",
                "description": "Yuqori sifatli audio va shovqinni bekor qiluvchi quloqchin",
                "sku": "HEADPHONE01",
                "price": 850000.0,
                "discount_price": None,
                "stock_quantity": 25,
                "category_slug": "smartfonlar",
                "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
            },
            {
                "name": "Sport krossovka",
                "slug": "sport-krossovka",
                "description": "Yengil va qulay sport krossovkasi",
                "sku": "SNEAKER01",
                "price": 320000.0,
                "discount_price": None,
                "stock_quantity": 30,
                "category_slug": "poyabzallar",
                "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"
            },
            {
                "name": "Erkaklar sport poyabzali",
                "slug": "erkaklar-sport-poyabzali",
                "description": "Kundalik kiyish uchun qulay ko'k rangli krossovka",
                "sku": "SNEAKER02",
                "price": 850000.0,
                "discount_price": None,
                "stock_quantity": 18,
                "category_slug": "poyabzallar",
                "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800"
            },
            {
                "name": "Klassik moviy ko'ylak",
                "slug": "klassik-moviy-koylak",
                "description": "100% paxtadan tayyorlangan yengil va zamonaviy ko'ylak",
                "sku": "SHIRT01",
                "price": 320000.0,
                "discount_price": None,
                "stock_quantity": 40,
                "category_slug": "kiyim-kechak",
                "image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800"
            },
            {
                "name": "iPhone 15 Pro",
                "slug": "iphone-15-pro",
                "description": "Eng yangi va kuchli flagman iPhone",
                "sku": "IPH15P",
                "price": 15000000.0,
                "discount_price": 14500000.0,
                "stock_quantity": 10,
                "category_slug": "smartfonlar",
                "image": "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800"
            },
            {
                "name": "MacBook Air M2",
                "slug": "macbook-air-m2",
                "description": "Yengil va samarali noutbuk",
                "sku": "MBAIR2",
                "price": 12000000.0,
                "discount_price": None,
                "stock_quantity": 8,
                "category_slug": "elektronika",
                "image": "https://images.unsplash.com/photo-1611186871348-b1ec696e5239?w=800"
            }
        ]

        for p_info in products_to_seed:
            res = await db.execute(select(Product).where(Product.slug == p_info["slug"]))
            prod = res.scalar_one_or_none()
            if not prod:
                cat = categories_map[p_info["category_slug"]]
                prod = Product(
                    category_id=cat.id,
                    name=p_info["name"],
                    slug=p_info["slug"],
                    description=p_info["description"],
                    sku=p_info["sku"],
                    price=p_info["price"],
                    discount_price=p_info["discount_price"],
                    stock_quantity=p_info["stock_quantity"],
                    is_active=True
                )
                db.add(prod)
                await db.flush()

                # Add image
                img = ProductImage(product_id=prod.id, url=p_info["image"], is_primary=True)
                db.add(img)

        # 6. Seed Branding Settings
        res = await db.execute(select(BrandingSettings))
        branding = res.scalar_one_or_none()
        if not branding:
            branding = BrandingSettings(
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
            db.add(branding)

        # 7. Seed Banners
        res = await db.execute(select(Banner))
        banner_check = res.scalars().all()
        if not banner_check:
            p_res = await db.execute(select(Product).limit(1))
            some_prod = p_res.scalar_one_or_none()
            prod_id = some_prod.id if some_prod else None
            
            db.add(Banner(
                name="Yangi Mavsum Chegirmalari",
                image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&auto=format&fit=crop&q=80",
                is_active=True,
                sort_order=1,
                product_id=prod_id
            ))
            db.add(Banner(
                name="Eng Yangi Smartfonlar",
                image_url="https://images.unsplash.com/photo-1696446701796-da61225697cc?w=1600&auto=format&fit=crop&q=80",
                is_active=True,
                sort_order=2
            ))
            await db.flush()

        await db.commit()
        print("Database initialization and seed completed successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())
