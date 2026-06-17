# schemas/common.py
from pydantic import BaseModel


class MessageOut(BaseModel):
    message: str
