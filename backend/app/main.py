from contextlib import asynccontextmanager

from app.ai.embedding import embedding_service
from app.core.exceptions import AppException
from app.core.settings import settings
from app.routers.address import router as address_router
from app.routers.admin_catalog import router as admin_catalog_router
from app.routers.auth import router as auth_router
from app.routers.cart import router as cart_router
from app.routers.catalog import router as catalog_router
from app.routers.company import router as company_router
from app.routers.config import router as config_router
from app.routers.order import router as order_router
from app.routers.pricing import router as pricing_router
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# FRONTEND_URL plus common Vite fallbacks (5173 taken → Vite bumps to 5174).
_CORS_ORIGINS = list(
    dict.fromkeys(
        [
            settings.FRONTEND_URL,
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        ]
    )
)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    embedding_service.warm_up()
    yield


app = FastAPI(
    title="Proxima B2B Procurement API",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(auth_router)
app.include_router(address_router)
app.include_router(admin_catalog_router)
app.include_router(cart_router)
app.include_router(catalog_router)
app.include_router(company_router)
app.include_router(order_router)
app.include_router(pricing_router)
app.include_router(config_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
