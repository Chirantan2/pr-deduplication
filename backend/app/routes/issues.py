from fastapi import APIRouter, Body, Header, HTTPException, Query
from pydantic import BaseModel

from ..services.github_service import get_open_issues, get_prs_associated_with_issue, get_pr_changed_files, get_raw_diff_per_file, merge_pull_request
from ..services.matcher import score_pr_effectiveness

router = APIRouter()


class ScorePRRequest(BaseModel):
    issue_description: str
    raw_diff: dict[str, str]
    provider: str = "gemini"
    model: str | None = None
    gemini_api_key: str | None = None
    groq_api_key: str | None = None
    openai_api_key: str | None = None
    claude_api_key: str | None = None



@router.get("/issues")
def list_open_issues(
    owner: str = Query(..., description="GitHub repo owner"),
    repo: str = Query(..., description="GitHub repo name"),
    token: str = Header(..., alias="X-GitHub-Token", description="GitHub PAT"),
    per_page: int = Query(30, ge=1, le=100),
):
    """
    Fetch open issues (excluding PRs) for a GitHub repository.
    Token is passed via X-GitHub-Token header to keep it out of URLs.
    """
    try:
        issues = get_open_issues(
            bearer_token=token,
            owner=owner,
            repo=repo,
            per_page=per_page,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return {"issues": issues}


@router.get("/issues/{issue_number}/prs")
def get_prs_for_issue(
    owner: str = Query(..., description="GitHub repo owner"),
    repo: str = Query(..., description="GitHub repo name"),
    token: str = Header(..., alias="X-GitHub-Token", description="GitHub PAT"),
    issue_number: int = None,
    ):
    """
    List all PRs linked to a given issue, ranked by completeness & match.
    """
    try:
        associated_prs = get_prs_associated_with_issue(
            bearer_token=token,
            owner=owner,
            repo=repo,
            issue_number=issue_number
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
        
    return {"prs": associated_prs}

@router.get("/prs/{pr_number}/changed_files")
def get_changed_files_in_pr(
    owner: str = Query(..., description="GitHub repo owner"),
    repo: str = Query(..., description="GitHub repo name"),
    token: str = Header(..., alias="X-GitHub-Token", description="GitHub PAT"),
    pr_number: int = None,
):
    """
    Fetch changed files and code diffs for a pull request.
    """
    try:
        changed_files = get_pr_changed_files(
            bearer_token=token,
            owner=owner,
            repo=repo,
            pr_number=pr_number
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
        
    return {"changed_files": changed_files}

@router.get("/prs/{pr_number}/raw_diff")
def get_raw_diff_in_pr(
    owner: str = Query(..., description="GitHub repo owner"),
    repo: str = Query(..., description="GitHub repo name"),
    token: str = Header(..., alias="X-GitHub-Token", description="GitHub PAT"),
    pr_number: int = None,
):
    """
    Fetch the raw diff for a PR and split it into per-file diffs.
    """
    try:
        raw_diff = get_raw_diff_per_file(
            bearer_token=token,
            owner=owner,
            repo=repo,
            pr_number=pr_number
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
        
    return {"raw_diff": raw_diff}


@router.post("/score_pr")
def score_pr(body: ScorePRRequest):
    """
    Score how effectively a PR's changes address an issue.
    Uses a local Ollama model for LLM analysis.
    """
    try:
        result = score_pr_effectiveness(
            issue_description=body.issue_description,
            raw_diff=body.raw_diff,
            provider=body.provider,
            model=body.model,
            gemini_api_key=body.gemini_api_key,
            groq_api_key=body.groq_api_key,
            openai_api_key=body.openai_api_key,
            claude_api_key=body.claude_api_key,

        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return result


@router.put("/prs/{pr_number}/merge")
def merge_pr(
    pr_number: int,
    owner: str = Query(..., description="GitHub repo owner"),
    repo: str = Query(..., description="GitHub repo name"),
    token: str = Header(..., alias="X-GitHub-Token", description="GitHub PAT"),
    merge_method: str = Query("merge", description="merge, squash, or rebase"),
):
    """
    Merge a pull request on GitHub.
    """
    try:
        result = merge_pull_request(
            bearer_token=token,
            owner=owner,
            repo=repo,
            pr_number=pr_number,
            merge_method=merge_method,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return result