with open("apps/api/tests/routers/test_ater_traversal.py", "r") as f:
    content = f.read()

# test_obsidian_file_write_path_traversal: the content needs to be raw string as per the body dependency, but body(...) in FastAPI usually expects plain string
content = content.replace('json={"content": "malicious"}', 'content="malicious"')

with open("apps/api/tests/routers/test_ater_traversal.py", "w") as f:
    f.write(content)
