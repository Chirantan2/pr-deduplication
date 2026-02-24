from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import health, issues, auth, users, repositories
from .core.database import Base, engine
from .models.repository import Repository  # ensure model is registered

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PR Assistant API")

# CORS configuration (development mode)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(issues.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(repositories.router)
