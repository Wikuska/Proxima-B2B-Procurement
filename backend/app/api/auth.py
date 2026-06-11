from core import security
from database import get_db
from fastapi import APIRouter, Depends, status
from schemas import Token, UserCreate, UserLogin, UserOut
from services import auth as auth_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user with automatic B2B domain matching (Fast Track)."""
    new_user = await auth_service.register_user(db, user_in)
    return new_user


@router.get("/verify", status_code=status.HTTP_200_OK)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    """Verify user's email using the token printed in the console."""
    user = await auth_service.verify_user_email(db, token)
    return {"message": f"Email {user.email} has been successfully verified."}


@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    """Standard JSON login endpoint."""
    user = await auth_service.authenticate_user(db, user_in.email, user_in.password)

    access_token = security.create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}
