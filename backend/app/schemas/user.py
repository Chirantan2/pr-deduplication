from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserSettingsBase(BaseModel):
    github_token: Optional[str] = None
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    claude_api_key: Optional[str] = None

class UserSettingsUpdate(UserSettingsBase):
    pass

class UserSettings(UserSettingsBase):
    class Config:
        from_attributes = True

class RepositoryCreate(BaseModel):
    owner: str
    repo: str

class RepositorySchema(BaseModel):
    id: int
    owner: str
    repo: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class User(UserBase):
    id: int
    settings: Optional[UserSettings] = None
    repositories: List[RepositorySchema] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
