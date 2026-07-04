with open("apps/api/tests/routers/test_ater_traversal.py", "r") as f:
    content = f.read()

content = content.replace("from api.main import app\nfrom api.deps import AppSecrets, get_app_secrets", "from src.api.main import app\nfrom src.api.deps import AppSecrets, get_app_secrets")

with open("apps/api/tests/routers/test_ater_traversal.py", "w") as f:
    f.write(content)
