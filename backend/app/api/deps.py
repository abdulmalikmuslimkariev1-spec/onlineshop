from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from sqlalchemy.orm import selectinload

from app.core import security
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token",
    auto_error=False
)

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(reusable_oauth2)
) -> User:
    if not token or token.strip() in ("null", "undefined", ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if not token_data.sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except (jwt.JWTError, ValidationError, ValueError, Exception):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(
        select(User).where(User.id == token_data.sub).options(selectinload(User.roles))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user

from fastapi import Request

def verify_app_context(request: Request, current_user: User = Depends(get_current_active_user)) -> User:
    """
    Verifies if the current user's role matches the origin application context.
    """
    origin = request.headers.get("origin")
    if not origin:
        # Fallback to referer if origin is missing (rare for cross-origin AJAX)
        referer = request.headers.get("referer")
        if referer:
            origin = "/".join(referer.split("/")[:3])
            
    if not origin:
        return current_user # Can't verify context, rely on RBAC
        
    base_domain = settings.BASE_DOMAIN
    
    # Mapping of origins to allowed roles
    context_role_map = {
        f"https://{base_domain}": ["CUSTOMER", "OPERATOR", "COURIER", "ADMIN", "SUPERADMIN"],
        f"https://superadmin.{base_domain}": ["SUPERADMIN"],
        f"https://admin.{base_domain}": ["ADMIN", "SUPERADMIN"],
        f"https://operator.{base_domain}": ["OPERATOR", "ADMIN", "SUPERADMIN"],
        f"https://courier.{base_domain}": ["COURIER", "ADMIN", "SUPERADMIN"],
    }
    
    if origin in context_role_map:
        allowed_roles = context_role_map[origin]
        user_roles = [r.name for r in current_user.roles]
        if current_user.is_superuser:
            user_roles.append("SUPERADMIN")
            
        if not any(role in user_roles for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Role not authorized for this application context"
            )
            
    return current_user
