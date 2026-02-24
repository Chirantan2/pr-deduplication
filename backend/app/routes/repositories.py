from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.repository import Repository
from ..models.user import User
from ..schemas.user import RepositoryCreate, RepositorySchema
from ..routes.users import get_current_user
from ..services.github_service import get_repo_stats

router = APIRouter(prefix="/repositories", tags=["repositories"])


@router.get("", response_model=List[RepositorySchema])
def list_repositories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Repository).filter(Repository.user_id == current_user.id).all()


@router.post("", response_model=RepositorySchema, status_code=status.HTTP_201_CREATED)
def add_repository(repo_data: RepositoryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check for duplicate
    existing = db.query(Repository).filter(
        Repository.user_id == current_user.id,
        Repository.owner == repo_data.owner,
        Repository.repo == repo_data.repo
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Repository already added")

    new_repo = Repository(
        user_id=current_user.id,
        owner=repo_data.owner,
        repo=repo_data.repo
    )
    db.add(new_repo)
    db.commit()
    db.refresh(new_repo)
    return new_repo


@router.delete("/{repo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_repository(repo_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = db.query(Repository).filter(
        Repository.id == repo_id,
        Repository.user_id == current_user.id
    ).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    db.delete(repo)
    db.commit()


@router.get("/{repo_id}/stats")
def get_repository_stats(repo_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = db.query(Repository).filter(
        Repository.id == repo_id,
        Repository.user_id == current_user.id
    ).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Get GitHub token from user settings
    token = current_user.settings.github_token if current_user.settings else None
    if not token:
        raise HTTPException(status_code=400, detail="GitHub token not configured")

    try:
        stats = get_repo_stats(bearer_token=token, owner=repo.owner, repo=repo.repo)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return stats
