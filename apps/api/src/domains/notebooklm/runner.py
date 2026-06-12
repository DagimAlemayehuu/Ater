import sys
import os
import shutil
import asyncio
import json
import logging
import re
import time
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger("Ater.NotebookLM")

class NotebookLMException(Exception):
    """Custom exception for NotebookLM runner failures."""
    pass

class NotebookLMRunner:
    _auth_status_cache: Optional[Dict[str, Any]] = None
    _auth_status_cache_at: float = 0.0
    _auth_status_cache_ttl: float = 5.0

    @classmethod
    def compact_cli_error(cls, output: str) -> str:
        text = (output or "").strip()
        if not text:
            return ""
        if "ConnectError:" in text:
            match = re.search(r"ConnectError:\s*([^\n]+)", text)
            if match:
                return f"ConnectError: {match.group(1).strip()}"
        if "No such option:" in text:
            match = re.search(r"No such option:\s*([^\n│╰]+)", text)
            if match:
                return f"No such option: {match.group(1).strip()}"
        lines = [line.strip(" │╭╮╰─") for line in text.splitlines() if line.strip(" │╭╮╰─")]
        return "\n".join(lines[-6:])[:1200] if lines else text[:1200]

    @classmethod
    def get_nlm_binary(cls) -> str:
        """Find the absolute path to the nlm CLI binary."""
        nlm_path = shutil.which("nlm")
        if not nlm_path:
            local_nlm = Path(sys.executable).parent / "nlm"
            if local_nlm.exists():
                nlm_path = str(local_nlm)
        if not nlm_path:
            # Last fallback
            nlm_path = "nlm"
        return nlm_path

    @classmethod
    async def run_command(cls, args: List[str], parse_json: bool = False) -> Any:
        """
        Executes an 'nlm' command asynchronously.
        Returns parsed JSON or raw stdout string.
        """
        binary = cls.get_nlm_binary()
        cmd = [binary] + args
        
        logger.info(f"Executing: {' '.join(cmd)}")
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=os.environ.copy()
            )
            
            stdout, stderr = await process.communicate()
            stdout_str = stdout.decode("utf-8", errors="replace").strip()
            stderr_str = stderr.decode("utf-8", errors="replace").strip()
            
            if process.returncode != 0:
                compact_error = cls.compact_cli_error(stderr_str or stdout_str)
                logger.error(f"Command failed with code {process.returncode}: {compact_error}")
                raise NotebookLMException(f"NotebookLM Command Failed: {compact_error}")
            
            if parse_json:
                try:
                    return json.loads(stdout_str)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON output: {stdout_str}")
                    raise NotebookLMException(f"Invalid JSON response from CLI: {e}")
            
            return stdout_str
            
        except Exception as e:
            if not isinstance(e, NotebookLMException):
                logger.error(f"Unexpected execution error: {e}")
                raise NotebookLMException(f"Execution Error: {e}")
            raise e

    @classmethod
    def clear_auth_status_cache(cls) -> None:
        cls._auth_status_cache = None
        cls._auth_status_cache_at = 0.0

    @classmethod
    def normalize_artifact_type(cls, artifact_type: str) -> str:
        """Map API/agent artifact names to the installed nlm command names."""
        normalized = (artifact_type or "").strip().replace("-", "_")
        aliases = {
            "mind_map": "mindmap",
            "mindmap": "mindmap",
            "slide_deck": "slides",
            "slides": "slides",
            "data_table": "data-table",
            "data-table": "data-table",
        }
        return aliases.get(normalized, normalized)

    @classmethod
    def normalize_download_artifact_type(cls, artifact_type: str) -> str:
        normalized = (artifact_type or "").strip().replace("-", "_")
        aliases = {
            "audio": "audio",
            "video": "video",
            "report": "report",
            "quiz": "quiz",
            "flashcards": "flashcards",
            "infographic": "infographic",
            "mindmap": "mind-map",
            "mind_map": "mind-map",
            "slide_deck": "slide-deck",
            "slides": "slide-deck",
            "data_table": "data-table",
            "data-table": "data-table",
        }
        return aliases.get(normalized, normalized)

    @classmethod
    def _append_common_generation_options(cls, args: List[str], payload: Dict[str, Any]) -> None:
        language = payload.get("language")
        focus = payload.get("focus") or payload.get("focus_prompt")
        source_ids = payload.get("source_ids")
        if language:
            args += ["--language", str(language)]
        if focus:
            args += ["--focus", str(focus)]
        if source_ids:
            if isinstance(source_ids, list):
                source_ids = ",".join(str(source_id) for source_id in source_ids if source_id)
            args += ["--source-ids", str(source_ids)]

    @classmethod
    def build_studio_create_args(cls, notebook_id: str, payload: Dict[str, Any]) -> List[str]:
        artifact_type = payload.get("artifact_type")
        if not artifact_type:
            raise ValueError("artifact_type is required")

        cli_artifact_type = cls.normalize_artifact_type(str(artifact_type))
        args = [cli_artifact_type, "create", notebook_id, "--confirm"]

        if cli_artifact_type == "audio":
            if payload.get("audio_format"):
                args += ["--format", str(payload["audio_format"])]
            if payload.get("audio_length"):
                args += ["--length", str(payload["audio_length"])]
            cls._append_common_generation_options(args, payload)

        elif cli_artifact_type == "report":
            if payload.get("report_format"):
                args += ["--format", str(payload["report_format"])]
            prompt = payload.get("custom_prompt") or payload.get("prompt")
            if prompt:
                args += ["--prompt", str(prompt)]
            cls._append_common_generation_options(args, payload)

        elif cli_artifact_type == "quiz":
            if payload.get("question_count"):
                args += ["--count", str(payload["question_count"])]
            if payload.get("difficulty"):
                args += ["--difficulty", str(payload["difficulty"])]
            cls._append_common_generation_options(args, payload)

        elif cli_artifact_type == "flashcards":
            if payload.get("difficulty"):
                args += ["--difficulty", str(payload["difficulty"])]
            cls._append_common_generation_options(args, payload)

        elif cli_artifact_type == "mindmap":
            if payload.get("title"):
                args += ["--title", str(payload["title"])]
            source_ids = payload.get("source_ids")
            if source_ids:
                if isinstance(source_ids, list):
                    source_ids = ",".join(str(source_id) for source_id in source_ids if source_id)
                args += ["--source-ids", str(source_ids)]

        elif cli_artifact_type == "slides":
            if payload.get("slide_format"):
                args += ["--format", str(payload["slide_format"])]
            if payload.get("slide_length"):
                args += ["--length", str(payload["slide_length"])]
            cls._append_common_generation_options(args, payload)

        elif cli_artifact_type == "infographic":
            if payload.get("orientation"):
                args += ["--orientation", str(payload["orientation"])]
            if payload.get("detail_level"):
                args += ["--detail", str(payload["detail_level"])]
            if payload.get("infographic_style"):
                args += ["--style", str(payload["infographic_style"])]
            cls._append_common_generation_options(args, payload)

        elif cli_artifact_type == "video":
            if payload.get("video_format"):
                args += ["--format", str(payload["video_format"])]
            if payload.get("video_style"):
                args += ["--style", str(payload["video_style"])]
            style_prompt = payload.get("video_style_prompt") or payload.get("style_prompt")
            if style_prompt:
                args += ["--style-prompt", str(style_prompt)]
            cls._append_common_generation_options(args, payload)

        elif cli_artifact_type == "data-table":
            description = payload.get("description")
            if not description:
                raise ValueError("description is required for data-table")
            args += [str(description)]
            cls._append_common_generation_options(args, payload)

        else:
            cls._append_common_generation_options(args, payload)

        return args

    @classmethod
    def build_download_args(
        cls,
        artifact_type: str,
        notebook_id: str,
        output_path: Path,
        artifact_id: Optional[str] = None,
        output_format: Optional[str] = None,
    ) -> List[str]:
        download_type = cls.normalize_download_artifact_type(artifact_type)
        args = ["download", download_type, notebook_id, "--output", str(output_path)]
        if artifact_id:
            args += ["--id", artifact_id]
        if output_format:
            args += ["--format", output_format]
        if download_type in {"audio", "video", "slide-deck", "infographic"}:
            args += ["--no-progress"]
        return args

    @classmethod
    def parse_auth_status_text(cls, text: str) -> Dict[str, Any]:
        lower = text.lower()
        configured = (
            "authentication valid" in lower
            or "logged in" in lower
            or "valid!" in lower
            or "notebooks found:" in lower
        )
        profile = None
        email = None
        notebooks_found = None

        for raw_line in text.splitlines():
            line = raw_line.strip()
            line_lower = line.lower()
            if line_lower.startswith("profile:"):
                profile = line.split(":", 1)[1].strip() or None
            elif "profile:" in line_lower and not profile:
                profile = line.split("profile:", 1)[-1].strip() or None

            if line_lower.startswith("account:"):
                email = line.split(":", 1)[1].strip() or None
            elif "@" in line and not email:
                match = re.search(r"[\w.+-]+@[\w.-]+\.\w+", line)
                if match:
                    email = match.group(0)

            if line_lower.startswith("notebooks found:"):
                match = re.search(r"\d+", line)
                if match:
                    notebooks_found = int(match.group(0))

        return {
            "auth_status": "configured" if configured else "stale",
            "email": email or profile or "default",
            "profile": profile or "default",
            "notebooks_found": notebooks_found,
            "cached": False,
        }

    @classmethod
    def classify_auth_error(cls, error: Exception) -> Dict[str, Any]:
        message = str(error)
        lower = message.lower()
        if "connecterror" in lower or "nodename nor servname" in lower or "temporary failure in name resolution" in lower:
            status = "unverified"
            detail = "NotebookLM could not be reached. Check your internet connection and try again."
        elif "authentication failed" in lower or "expired" in lower or "unauthorized" in lower or "forbidden" in lower:
            status = "stale"
            detail = "NotebookLM authentication is stale. Reconnect your Google account."
        elif "no such file" in lower or "not found" in lower:
            status = "not_configured"
            detail = "The nlm CLI is not available in the sidecar environment."
        else:
            status = "not_configured"
            detail = message.splitlines()[0][:240] if message else "NotebookLM authentication could not be checked."

        return {
            "auth_status": status,
            "email": None,
            "profile": "default",
            "error": detail,
            "cached": False,
        }

    @classmethod
    async def get_auth_status(cls, force: bool = False) -> Dict[str, Any]:
        """Runs the installed nlm auth check and returns normalized status."""
        now = time.monotonic()
        if (
            not force
            and cls._auth_status_cache is not None
            and now - cls._auth_status_cache_at < cls._auth_status_cache_ttl
        ):
            return {**cls._auth_status_cache, "cached": True}

        try:
            text = await cls.run_command(["login", "--check"])
            status = cls.parse_auth_status_text(text)
        except Exception as ex:
            status = cls.classify_auth_error(ex)

        cls._auth_status_cache = status
        cls._auth_status_cache_at = time.monotonic()
        return status

    @classmethod
    async def start_login(cls, force: bool = True, clear: bool = False) -> str:
        """Runs 'nlm login' to launch the managed browser auth flow."""
        binary = cls.get_nlm_binary()
        cmd = [binary, "login"]
        if force:
            cmd.append("--force")
        if clear:
            cmd.append("--clear")
        try:
            cls.clear_auth_status_cache()
            process = await asyncio.create_subprocess_exec(
                *cmd,
                env=os.environ.copy()
            )
            return f"Spawning browser login (PID: {process.pid})"
        except Exception as e:
            raise NotebookLMException(f"Failed to trigger login browser: {e}")
