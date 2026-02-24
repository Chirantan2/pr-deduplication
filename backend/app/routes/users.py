from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import SECRET_KEY, ALGORITHM
from ..models.user import User, UserSettings
from ..schemas.user import User as UserSchema, UserSettingsUpdate, UserSettings as UserSettingsSchema

router = APIRouter(prefix="/users", tags=["users"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@router.get("/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/me/settings", response_model=UserSettingsSchema)
def read_user_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.settings:
        # Create settings if they don't exist (should happen at registration, but just in case)
        new_settings = UserSettings(user_id=current_user.id)
        db.add(new_settings)
        db.commit()
        db.refresh(current_user)
        
    return current_user.settings

@router.put("/me/settings", response_model=UserSettingsSchema)
def update_user_settings(settings_update: UserSettingsUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = current_user.settings
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
    
    # Update fields if provided
    update_data = settings_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    
    db.commit()
    db.refresh(settings)
    return settings
