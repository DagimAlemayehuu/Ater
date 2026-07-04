import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import os
import signal
import sys
import psutil
from fastapi import FastAPI

from src.api.lifespan import ServerLifespanManager
import src.api.state as state

@pytest.fixture(autouse=True)
def reset_state():
    state.ater_watcher = None
    state.rag_watcher = None
    yield
    state.ater_watcher = None
    state.rag_watcher = None

def test_start_watchdog():
    with patch("threading.Thread") as mock_thread:
        mock_instance = MagicMock()
        mock_thread.return_value = mock_instance

        ServerLifespanManager.start_watchdog()

        mock_thread.assert_called_once_with(target=ServerLifespanManager.parent_watchdog, daemon=True)
        mock_instance.start.assert_called_once()

def test_parent_watchdog_success():
    class BreakLoopException(Exception):
        pass

    with patch("os.getenv", return_value="1234"), \
         patch("psutil.Process") as mock_process, \
         patch("time.sleep", side_effect=BreakLoopException), \
         patch("src.api.lifespan.logger") as mock_logger:

        mock_proc_instance = MagicMock()
        mock_proc_instance.create_time.return_value = 1000.0
        mock_process.return_value = mock_proc_instance

        try:
            ServerLifespanManager.parent_watchdog()
        except BreakLoopException:
            pass

        mock_logger.info.assert_called_once()
        assert "Assigned to monitor Parent PID: 1234" in mock_logger.info.call_args[0][0]

def test_parent_watchdog_process_died():
    with patch("os.getenv", return_value="1234"), \
         patch("psutil.Process") as mock_process, \
         patch("time.sleep", return_value=None), \
         patch("os._exit") as mock_exit, \
         patch("src.api.lifespan.logger") as mock_logger:

        mock_proc_instance = MagicMock()
        mock_proc_instance.create_time.side_effect = [1000.0, psutil.NoSuchProcess(1234)]  # NoSuchProcess instead of time difference
        mock_process.return_value = mock_proc_instance

        ServerLifespanManager.parent_watchdog()

        mock_logger.critical.assert_called_once()
        mock_exit.assert_called_once_with(1)

def test_parent_watchdog_exception_on_startup():
    with patch("os.getenv", side_effect=Exception("Env error")), \
         patch("src.api.lifespan.logger") as mock_logger:

        ServerLifespanManager.parent_watchdog()

        mock_logger.error.assert_called_once()
        assert "Failed to start monitor: Env error" in mock_logger.error.call_args[0][0]

def test_register_signal_handlers():
    with patch("signal.signal") as mock_signal:
        ServerLifespanManager.register_signal_handlers()

        assert mock_signal.call_count == 2
        calls = mock_signal.call_args_list
        assert calls[0][0][0] == signal.SIGINT
        assert calls[1][0][0] == signal.SIGTERM

        handler = calls[0][0][1]

        # Test the handler
        state.ater_watcher = MagicMock()
        state.rag_watcher = MagicMock()

        with pytest.raises(SystemExit) as exc_info:
            handler(signal.SIGINT, None)

        assert exc_info.value.code == 0
        state.ater_watcher.stop.assert_called_once()
        state.rag_watcher.stop.assert_called_once()

@pytest.mark.asyncio
async def test_lifespan():
    app = FastAPI()

    state.ater_watcher = MagicMock()
    state.rag_watcher = MagicMock()

    with patch("shutil.which", return_value="/usr/bin/nlm"), \
         patch("src.api.lifespan.logger") as mock_logger:

        async with ServerLifespanManager.lifespan(app):
            pass

        # Startup checks
        mock_logger.info.assert_any_call("FastAPI sidecar startup event: non-blocking initialization verified.")
        mock_logger.info.assert_any_call("[NotebookLM] Verified 'nlm' CLI path: /usr/bin/nlm")

        # Shutdown checks
        mock_logger.info.assert_any_call("[Ater] Stopping watcher during shutdown")
        mock_logger.info.assert_any_call("[RAG] Stopping Vault Watcher during shutdown")
        state.ater_watcher.stop.assert_called_once()
        state.rag_watcher.stop.assert_called_once()

@pytest.mark.asyncio
async def test_lifespan_nlm_not_found():
    app = FastAPI()

    with patch("shutil.which", return_value=None), \
         patch("pathlib.Path.exists", return_value=False), \
         patch("src.api.lifespan.logger") as mock_logger:

        async with ServerLifespanManager.lifespan(app):
            pass

        mock_logger.error.assert_called_once_with("[NotebookLM] WARNING: 'nlm' CLI was not found in PATH or virtualenv bin. Subprocess operations may fail.")
