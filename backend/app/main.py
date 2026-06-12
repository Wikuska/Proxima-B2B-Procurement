from app.core.exceptions import AppException
from app.routers.auth import router as auth_router
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="Proxima B2B Procurement API", version="1.0.0")

app.include_router(auth_router)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
