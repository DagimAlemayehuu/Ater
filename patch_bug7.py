with open("apps/api/src/api/routers/ater.py", "r") as f:
    content = f.read()

content = content.replace("api_key = secrets.ai_api_key or \"mock-key\"", "api_key = secrets.ai_key or \"mock-key\"")

with open("apps/api/src/api/routers/ater.py", "w") as f:
    f.write(content)
