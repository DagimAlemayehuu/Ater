import multiprocessing
import uvicorn
from src.api.main import app

if __name__ == "__main__":
    # REQUIRED for PyInstaller on Windows to prevent infinite spawn loops
    multiprocessing.freeze_support() 
    uvicorn.run(app, host="127.0.0.1", port=8765)
