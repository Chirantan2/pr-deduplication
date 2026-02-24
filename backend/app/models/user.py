from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    settings = relationship("UserSettings", back_populates="user", uselist=False)
    repositories = relationship("Repository", back_populates="user", cascade="all, delete-orphan")

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    github_token = Column(String, nullable=True)
    gemini_api_key = Column(String, nullable=True)
    groq_api_key = Column(String, nullable=True)
    openai_api_key = Column(String, nullable=True)
    claude_api_key = Column(String, nullable=True)

    user = relationship("User", back_populates="settings")
