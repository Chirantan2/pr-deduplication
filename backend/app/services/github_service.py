"""
GitHub API service — business logic for interacting with GitHub.
"""

from typing import Dict, List

import requests


def get_repo_stats(
    bearer_token: str,
    owner: str,
    repo: str,
) -> Dict:
    """
    Fetch repository statistics from GitHub API.
    Returns dict with stars, forks, language, open issues/PRs count,
    recent commit info, and contributor count.
    """
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {bearer_token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    # 1. Repo metadata
    repo_url = f"https://api.github.com/repos/{owner}/{repo}"
    repo_resp = requests.get(repo_url, headers=headers, timeout=10)
    if repo_resp.status_code != 200:
        raise RuntimeError(f"GitHub API error {repo_resp.status_code}: {repo_resp.text}")
    repo_data = repo_resp.json()

    # 2. Most recent commit
    commits_url = f"https://api.github.com/repos/{owner}/{repo}/commits"
    commits_resp = requests.get(commits_url, headers=headers, params={"per_page": 1}, timeout=10)
    recent_commit = None
    if commits_resp.status_code == 200 and commits_resp.json():
        c = commits_resp.json()[0]
        recent_commit = {
            "sha": c["sha"][:7],
            "message": c["commit"]["message"].split("\n")[0][:80],
            "author": c["commit"]["author"]["name"],
            "date": c["commit"]["author"]["date"],
        }

    # 3. Contributors count (first page header gives total)
    contrib_url = f"https://api.github.com/repos/{owner}/{repo}/contributors"
    contrib_resp = requests.get(contrib_url, headers=headers, params={"per_page": 1}, timeout=10)
    contributors = 0
    if contrib_resp.status_code == 200:
        # Parse Link header for last page number
        link_header = contrib_resp.headers.get("Link", "")
        if 'rel="last"' in link_header:
            import re
            match = re.search(r'page=(\d+)>; rel="last"', link_header)
            if match:
                contributors = int(match.group(1))
        else:
            contributors = len(contrib_resp.json())

    return {
        "stars": repo_data.get("stargazers_count", 0),
        "forks": repo_data.get("forks_count", 0),
        "language": repo_data.get("language", "Unknown"),
        "open_issues": repo_data.get("open_issues_count", 0),
        "description": repo_data.get("description", ""),
        "default_branch": repo_data.get("default_branch", "main"),
        "contributors": contributors,
        "recent_commit": recent_commit,
    }



def get_open_issues(
    bearer_token: str,
    owner: str,
    repo: str,
    per_page: int = 30,
) -> List[Dict]:
    """
    Fetch open issues (excluding pull requests) for a GitHub repository.

    Args:
        bearer_token: GitHub Bearer token
        owner: Repository owner
        repo: Repository name
        per_page: Number of issues per page (max 100)

    Returns:
        List of open issue dicts straight from the GitHub API.
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/issues"

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {bearer_token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    params = {
        "state": "open",
        "per_page": min(per_page, 100),
    }

    response = requests.get(url, headers=headers, params=params, timeout=10)

    if response.status_code != 200:
        raise RuntimeError(
            f"GitHub API error {response.status_code}: {response.text}"
        )

    issues = response.json()

    # Filter out pull requests (PRs also appear in this endpoint)
    open_issues = [
        issue for issue in issues
        if "pull_request" not in issue
    ]

    return open_issues

def get_prs_associated_with_issue(
    bearer_token: str,
    owner: str,
    repo: str, 
    issue_number: int
) -> List[Dict]:
    """
    Find pull requests associated with a GitHub issue by searching
    PR titles and bodies for issue references.

    Args:
        bearer_token (str): GitHub Bearer token
        owner (str): Repository owner
        repo (str): Repository name
        issue_number (int): Issue number (e.g., 5)

    Returns:
        List[Dict]: List of associated PRs
    """

    url = f"https://api.github.com/repos/{owner}/{repo}/pulls"

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {bearer_token}",
        "X-Github-Api-Version": "2022-11-28",
    }

    params = {
        "state": "all", 
        "per_page": 100,
    }

    response = requests.get(url, headers=headers, params=params, timeout=10)

    if response.status_code != 200:
        raise RuntimeError(
            f"GitHub API error {response.status_code}: {response.text}"
        )

    pull_requests = response.json()
    issue_ref = f"#{issue_number}"

    associated_prs = [
        pr for pr in pull_requests
        if issue_ref in (pr.get("title", "") + pr.get("body", ""))
    ]

    return associated_prs


def get_pr_changed_files(
    bearer_token: str,
    owner: str,
    repo: str,
    pr_number: int
) -> List[Dict]:
    """
    Fetch changed files and code diffs for a pull request.

    Args:
        bearer_token (str): GitHub Bearer token
        owner (str): Repo owner
        repo (str): Repo name
        pr_number (int): Pull request number

    Returns:
        List[Dict]: Changed files with diffs
    """

    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/files"

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {bearer_token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    response = requests.get(url, headers=headers, timeout=10)

    if response.status_code != 200:
        raise RuntimeError(
            f"GitHub API error {response.status_code}: {response.text}"
        )

    return response.json()


def get_raw_diff_per_file(
    bearer_token: str,
    owner: str,
    repo: str,
    pr_number: int
) -> Dict[str, str]:
    """
    Fetch the raw diff for a PR and split it into per-file diffs.

    Returns:
        Dict[str, str]: { filename -> raw diff text }
    """

    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}"

    headers = {
        "Accept": "application/vnd.github.v3.diff",
        "Authorization": f"Bearer {bearer_token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    response = requests.get(url, headers=headers, timeout=10)

    if response.status_code != 200:
        raise RuntimeError(
            f"GitHub API error {response.status_code}: {response.text}"
        )

    raw_diff = response.text

    file_diffs: Dict[str, str] = {}
    current_file = None
    buffer = []

    for line in raw_diff.splitlines(keepends=True):
        if line.startswith("diff --git"):
            # Save previous file diff
            if current_file:
                file_diffs[current_file] = "".join(buffer)

            buffer = [line]

            # Extract filename (b/<file>)
            parts = line.split(" ")
            current_file = parts[-1].replace("b/", "").strip()
        else:
            buffer.append(line)

    # Save last file
    if current_file:
        file_diffs[current_file] = "".join(buffer)

    return file_diffs


def merge_pull_request(
    bearer_token: str,
    owner: str,
    repo: str,
    pr_number: int,
    merge_method: str = "merge",
) -> dict:
    """
    Merge a pull request via the GitHub API.

    Args:
        bearer_token: GitHub Bearer token
        owner: Repository owner
        repo: Repository name
        pr_number: Pull request number
        merge_method: One of 'merge', 'squash', or 'rebase'

    Returns:
        GitHub merge response dict.
    """

    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/merge"

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {bearer_token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    body = {
        "merge_method": merge_method,
    }

    response = requests.put(url, headers=headers, json=body, timeout=15)

    if response.status_code not in (200, 405, 409):
        raise RuntimeError(
            f"GitHub API error {response.status_code}: {response.text}"
        )

    return response.json()
