
import json
import sys

log_file = '/Users/dabodestroyer/.gemini/antigravity/brain/8fd6a4df-ce70-4c91-95c0-7295d63f48fd/.system_generated/logs/overview.txt'

def extract_content(step_index):
    with open(log_file, 'r') as f:
        for line in f:
            try:
                data = json.loads(line)
                if data.get('step_index') == step_index:
                    # Check tool_calls
                    if 'tool_calls' in data:
                        for call in data['tool_calls']:
                            if call['name'] == 'write_to_file' or call['name'] == 'replace_file_content':
                                return call['args'].get('CodeContent') or call['args'].get('ReplacementContent')
                    # Check content (user request)
                    if 'content' in data:
                        return data['content']
            except:
                continue
    return None

# User request snippet (step 776)
snippet = extract_content(776)
if snippet:
    with open('waitlist_snippet.html', 'w') as f:
        f.write(snippet)
    print("Extracted snippet to waitlist_snippet.html")

# Previous high-fidelity version (step 781)
code = extract_content(781)
if code:
    with open('waitlist_prev.tsx', 'w') as f:
        f.write(code)
    print("Extracted code to waitlist_prev.tsx")
