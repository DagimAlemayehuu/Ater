with open("apps/api/tests/routers/test_ater_traversal.py", "r") as f:
    content = f.read()

# Starlette routing uses `scope["path"]` to match routes.
# Wait! `{note_path:path}` matches paths after `/api/ater/notes/`.
# It expects the URL-decoded value in `scope["path"]`? Or does it match `scope["path"]` which we set to `.../%2E%2E%2Fescape.md/restore`?
# In Starlette, if a path contains `%2E` it usually expects it unescaped for routing matching unless it matches exactly.
# Let's just bypass all this routing layer traversal stripping nonsense and directly test the endpoint function!

new_test = """
def test_note_version_restore_path_traversal():
    from src.api.routers.ater import restore_note_version
    import asyncio
    
    # We test the endpoint logic directly to bypass Starlette routing traversal protections
    async def run_direct():
        try:
            await restore_note_version(
                note_path="%2E%2E%2Fescape.md",
                payload={"version_id": "test"},
                secrets=mock_get_app_secrets()
            )
            return 200
        except Exception as e:
            from fastapi import HTTPException
            if isinstance(e, HTTPException):
                return e.status_code
            return 500
            
    status = asyncio.run(run_direct())
    assert status == 400
"""

# Replace the current test
import re
content = re.sub(r"def test_note_version_restore_path_traversal\(\):.*?assert responses\[0\] == 400", new_test.strip(), content, flags=re.DOTALL)

with open("apps/api/tests/routers/test_ater_traversal.py", "w") as f:
    f.write(content)
