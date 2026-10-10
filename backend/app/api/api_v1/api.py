from fastapi import APIRouter
from app.api.api_v1.endpoints import login, admin, operator, courier, customer

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(operator.router, prefix="/operator", tags=["operator"])
api_router.include_router(courier.router, prefix="/courier", tags=["courier"])
api_router.include_router(customer.router, prefix="/customer", tags=["customer"])
