import re

FILE_PATH = "apps/api/src/domains/oka/validator.py"

with open(FILE_PATH, "r") as f:
    content = f.read()

OLD_WIKILINK_CHECK = """        if note_type not in ("hub", "possible questions") and wikilink_count < 3:
            errors.append(
                f"INSUFFICIENT_WIKILINKS: Found {wikilink_count}, need ≥ 3. "
                "Sections 2 and 3 must wrap related concepts in [[Wikilinks]]."
            )"""

NEW_WIKILINK_CHECK = """        if note_type not in ("hub", "possible questions") and wikilink_count < 3:
            errors.append(
                f"INSUFFICIENT_WIKILINKS: Found {wikilink_count}, need ≥ 3. "
                "Section 2 must wrap related concepts in [[Wikilinks]]."
            )"""

content = content.replace(OLD_WIKILINK_CHECK, NEW_WIKILINK_CHECK)

with open(FILE_PATH, "w") as f:
    f.write(content)
print("Validator updated!")
