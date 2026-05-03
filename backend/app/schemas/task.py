from typing import Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field

Status = Literal["todo", "doing", "done"]
Priority = Literal["low", "medium", "high"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Priority = "medium"
    status: Status = "todo"


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None
    position: Optional[int] = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: Status
    priority: Priority
    position: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
