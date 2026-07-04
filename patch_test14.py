with open("apps/api/tests/routers/test_ater_traversal.py", "r") as f:
    content = f.read()

# I also need to restore test_note_version_restore_path_traversal to use the client.post() test format! 

new_test = """
def test_note_version_restore_path_traversal():
    response = client.post("/api/ater/notes/..%2Fescape.md/restore", json={"version_id": "test"})
    assert response.status_code == 400
"""

import re
content = re.sub(r"def test_note_version_restore_path_traversal\(\):.*?assert status == 400", new_test.strip(), content, flags=re.DOTALL)

with open("apps/api/tests/routers/test_ater_traversal.py", "w") as f:
    f.write(content)
