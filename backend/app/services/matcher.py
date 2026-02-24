"""
PR–Issue Matcher — scores how effectively a PR's changes address an issue.
Supports Gemini, Groq, OpenAI, Claude (Anthropic), and Ollama as LLM providers.
"""

import json
import os
import requests

import google.generativeai as genai
from groq import Groq, RateLimitError
from openai import OpenAI
import anthropic


OLLAMA_BASE = "http://localhost:11434"
DEFAULT_OLLAMA_MODEL = "llama3.2:3b"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-20250514"
DEFAULT_MODEL = DEFAULT_GEMINI_MODEL

GROQ_MODELS = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "moonshotai/kimi-k2-instruct",
    "moonshotai/kimi-k2-instruct-0905",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
]




def _build_prompt(issue_description: str, raw_diff: dict[str, str]) -> str:
    """Build the scoring prompt (shared by both providers)."""
    diff_text = "\n".join(
        f"--- {filename} ---\n{diff}"
        for filename, diff in raw_diff.items()
    )

    MAX_DIFF_CHARS = 12_000
    if len(diff_text) > MAX_DIFF_CHARS:
        diff_text = diff_text[:MAX_DIFF_CHARS] + "\n... [diff truncated] ..."

    return f"""You are a senior code reviewer. Analyze how effectively the following Pull Request changes solve the described issue.

## Issue Description
{issue_description}

## PR Diff (per file)
{diff_text}

## Instructions
1. Evaluate whether the PR changes actually address the issue requirements.
2. Identify strengths — things the PR does well towards solving the issue.
3. Identify gaps — requirements from the issue that are NOT addressed or only partially addressed.
4. Assign a score from 0 to 100:
   - 0-20: PR is unrelated or does not address the issue
   - 21-50: PR partially addresses the issue with significant gaps
   - 51-80: PR addresses most of the issue with minor gaps
   - 81-100: PR fully and effectively solves the issue

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{{
  "score": <int>,
  "summary": "<one-sentence summary>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "gaps": ["<gap 1>", "<gap 2>"]
}}"""


def _parse_result(result: dict) -> dict:
    """Normalise / validate the expected keys from LLM response."""
    return {
        "score": int(result.get("score", 0)),
        "summary": str(result.get("summary", "")),
        "strengths": list(result.get("strengths", [])),
        "gaps": list(result.get("gaps", [])),
    }


def _score_with_ollama(prompt: str, model: str) -> dict:
    """Score using a local Ollama model."""
    response = requests.post(
        f"{OLLAMA_BASE}/api/chat",
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "format": "json",
        },
        timeout=120,
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"Ollama API error {response.status_code}: {response.text}"
        )

    content = response.json().get("message", {}).get("content", "")

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        raise RuntimeError(f"Ollama returned invalid JSON: {content[:500]}")

    return _parse_result(result)


def _score_with_gemini(prompt: str, model: str, api_key: str) -> dict:
    """Score using Google Gemini API."""
    genai.configure(api_key=api_key)
    gemini_model = genai.GenerativeModel(model)

    response = gemini_model.generate_content(
        prompt,
        generation_config={
            "response_mime_type": "application/json",
        },
    )

    try:
        result = json.loads(response.text)
    except json.JSONDecodeError:
        raise RuntimeError(f"Gemini returned invalid JSON: {response.text[:500]}")

    return _parse_result(result)


def _score_with_groq(prompt: str, api_key: str) -> dict:
    """Score using Groq API with fallback on rate limits."""
    client = Groq(api_key=api_key)
    
    last_exception = None

    for model in GROQ_MODELS:
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=model,
                response_format={"type": "json_object"},
            )
            
            content = chat_completion.choices[0].message.content
            try:
                result = json.loads(content)
                return _parse_result(result)
            except json.JSONDecodeError:
                raise RuntimeError(f"Groq returned invalid JSON: {content[:500]}")
                
        except RateLimitError as e:
            print(f"Rate limit hit for model {model}, switching to next model...")
            last_exception = e
            continue
        except Exception as e:
            # For other errors, we might not want to switch models, 
            # but to refer to the prompt "if you encouter rate limits ... switch".
            # So I will raise for other errors.
            raise RuntimeError(f"Groq error with model {model}: {e}")

    raise RuntimeError(f"All Groq models exhausted. Last error: {last_exception}")


def _score_with_openai(prompt: str, model: str, api_key: str) -> dict:
    """Score using OpenAI API."""
    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        raise RuntimeError(f"OpenAI returned invalid JSON: {content[:500]}")

    return _parse_result(result)


def _score_with_claude(prompt: str, model: str, api_key: str) -> dict:
    """Score using Anthropic Claude API."""
    client = anthropic.Anthropic(api_key=api_key)

    message = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt + "\n\nRespond ONLY with valid JSON, no markdown fences."}],
    )

    content = message.content[0].text
    # Strip markdown fences if present
    if content.strip().startswith("```"):
        lines = content.strip().split("\n")
        content = "\n".join(lines[1:-1])

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        raise RuntimeError(f"Claude returned invalid JSON: {content[:500]}")

    return _parse_result(result)


def score_pr_effectiveness(
    issue_description: str,
    raw_diff: dict[str, str],
    provider: str = "gemini",
    model: str | None = None,
    gemini_api_key: str | None = None,
    groq_api_key: str | None = None,
    openai_api_key: str | None = None,
    claude_api_key: str | None = None,
) -> dict:
    """
    Ask an LLM to evaluate how well a PR addresses an issue.

    Args:
        issue_description: The full issue text (title + body).
        raw_diff:          Per-file diffs as {filename: diff_text}.
        provider:          "gemini", "groq", "openai", "claude", or "ollama".
        model:             Model name (uses provider default if None).
        gemini_api_key:    API key for Gemini.
        groq_api_key:      API key for Groq.
        openai_api_key:    API key for OpenAI.
        claude_api_key:    API key for Claude (Anthropic).

    Returns:
        { "score": int, "summary": str, "strengths": list, "gaps": list }
    """
    prompt = _build_prompt(issue_description, raw_diff)

    if provider == "gemini":
        api_key = gemini_api_key or os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("Gemini API key not provided.")
        return _score_with_gemini(prompt, model or DEFAULT_GEMINI_MODEL, api_key)
    elif provider == "groq":
        api_key = groq_api_key or os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            raise RuntimeError("Groq API key not provided.")
        return _score_with_groq(prompt, api_key)
    elif provider == "openai":
        api_key = openai_api_key or os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            raise RuntimeError("OpenAI API key not provided.")
        return _score_with_openai(prompt, model or DEFAULT_OPENAI_MODEL, api_key)
    elif provider == "claude":
        api_key = claude_api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise RuntimeError("Claude API key not provided.")
        return _score_with_claude(prompt, model or DEFAULT_CLAUDE_MODEL, api_key)
    else:
        return _score_with_ollama(prompt, model or DEFAULT_OLLAMA_MODEL)

