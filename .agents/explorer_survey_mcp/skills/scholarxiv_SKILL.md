# Local copy of Scholarxiv SKILL.md
# Source: /Users/dabodestroyer/.gemini/config/skills/scholarxiv/SKILL.md

Refer to authoritative source for full contents.
Key capabilities:
- Streamable HTTP MCP at https://www.scholarxiv.com/api/mcp
- REST API at /api/v1/papers/...
- Tools: search_papers, get_paper, get_paper_full_text, federated_search, etc.
- Invariants: Authorization header `Bearer sxv_...`, 1200 req/hr rate limits, retry-after support, 5min cache TTL.
