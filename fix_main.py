with open('apps/api/src/api/main.py', 'r') as f:
    code = f.read()

# Fix the type errors by explicitly casting/fallback for .get()
# e.g., query_data.get("query") -> query_data.get("query", "")
# e.g., query_data.get("context") -> query_data.get("context", "")

for agent_name in ["Financer", "Scout", "Scribe", "Architect", "Auditor"]:
    code = code.replace(
        f'response = await agent.chat(query_data.get("query"), history=query_data.get("history"), context=query_data.get("context"))',
        f'response = await agent.chat(query_data.get("query", ""), history=query_data.get("history"), context=query_data.get("context", ""))'
    )

with open('apps/api/src/api/main.py', 'w') as f:
    f.write(code)
