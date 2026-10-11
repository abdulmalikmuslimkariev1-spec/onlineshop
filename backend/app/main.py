from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.api.api_v1.api import api_router
from app.core.config import settings
import os

UPLOAD_DIR = "/app/applet/backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/api/uploads/{filename}")
async def serve_uploaded_file(filename: str):
    safe_name = os.path.basename(filename)
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@app.on_event("startup")
async def on_startup():
    from app.db.init_db import init_db
    try:
        await init_db()
        print("Backend startup: database checked and initialized.")
    except Exception as e:
        print(f"Startup DB init warning: {e}")

@app.get("/api/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    health_info = {
        "status": "ok",
        "database": "disconnected"
    }
    try:
        # Check database connectivity
        await db.execute(text("SELECT 1"))
        health_info["database"] = "connected"
    except Exception as e:
        # Gracefully handle database errors for the health check
        print(f"Database health check failed: {e}")
    
    return health_info

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
