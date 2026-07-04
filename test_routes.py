from src.api.main import app

for route in app.routes:
    if "artifact" in getattr(route, "path", ""):
        print(route.path, getattr(route.endpoint, "__name__", ""))
