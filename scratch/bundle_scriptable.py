import os
import json
import base64

def build_scriptable():
    root = "/Users/dabodestroyer/code/Antigravity/LifeOs"
    mobile_client_dir = os.path.join(root, "apps/mobile-client")
    mobile_dist = os.path.join(mobile_client_dir, "dist")
    template_path = os.path.join(root, "LifeOs_Mobile.js")
    
    js_path = os.path.join(mobile_dist, "index.js")
    css_path = os.path.join(mobile_dist, "mobile-client.css")
    
    if not os.path.exists(js_path) or not os.path.exists(css_path):
        print("Error: Build artifacts not found.")
        return
    
    with open(js_path, "r") as f:
        js_content = f.read()
    with open(css_path, "r") as f:
        css_content = f.read()
        
    js_b64 = base64.b64encode(js_content.encode('utf-8')).decode('utf-8')
    css_b64 = base64.b64encode(css_content.encode('utf-8')).decode('utf-8')

    scriptable_template = f"""// LifeOS Mobile - Resilient Native Implementation
// Generated: 2026-04-22 07:15

const JS_B64 = "{js_b64}";
const CSS_B64 = "{css_b64}";

const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <script>
    (function() {{
      const _OrigURL = window.URL;
      window.URL = function(url, base) {{
        try {{
          return new _OrigURL(url, base || "https://lifeos.local");
        }} catch (e) {{
          return {{ href: url, pathname: url, search: "", hash: "" }};
        }}
      }};
      window.URL.prototype = _OrigURL.prototype;
      window.URL.createObjectURL = _OrigURL.createObjectURL;
      window.URL.revokeObjectURL = _OrigURL.revokeObjectURL;

      const _oldFetch = window.fetch;
      window.fetch = function(input, init) {{
        const url = typeof input === 'string' ? input : (input.url || "");
        if (url === "/" || url === "./" || url === "" || url.startsWith("blob:")) {{
          return Promise.resolve(new Response("", {{ status: 200 }}));
        }}
        return _oldFetch(input, init);
      }};

      window.LifeOS = {{
        platform: "ios-scriptable",
        send: (type, data) => {{
          const msg = JSON.stringify({{ type, ...data }});
          if (typeof Scriptable !== 'undefined' && Scriptable.postMessage) {{
            Scriptable.postMessage(msg);
          }} else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.scriptable) {{
            window.webkit.messageHandlers.scriptable.postMessage(msg);
          }}
        }},
        onResponse: (requestId, data, error) => {{
          window.dispatchEvent(new CustomEvent('lifeos-api-response', {{ detail: {{ requestId, data, error }} }}));
        }}
      }};
    }})();
  </script>
  <style id="main-style"></style>
</head>
<body style="margin: 0; padding: 0; background: #000;">
  <div id="root"></div>
  <div id="boot-loader" style="position:fixed; inset:0; background:#000; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:10000; font-family:-apple-system;">
    <div style="width:24px; height:24px; border:2px solid rgba(255,255,255,0.1); border-top-color:#fff; border-radius:50%; animation:spin 1s linear infinite;"></div>
    <div style="margin-top:20px; font-size:10px; font-weight:900; letter-spacing:0.4em; color:#444;">SYNCING_SYSTEM</div>
  </div>
  <style>@keyframes spin {{ to {{ transform: rotate(360deg); }} }}</style>
  <script>
    (function() {{
      try {{
        document.getElementById('main-style').innerHTML = atob("{css_b64}");
        const script = document.createElement('script');
        script.innerHTML = decodeURIComponent(escape(atob("{js_b64}")));
        document.body.appendChild(script);
      }} catch (e) {{
        document.getElementById('boot-loader').innerHTML = '<div style="padding:20px; color:red; font-size:12px;">BOOT_ERR: ' + e.message + '</div>';
      }}
    }})();
  </script>
</body>
</html>
`;

class NativeBackend {{
  constructor() {{
    this.fm = FileManager.local();
    this.configPath = this.fm.joinPath(this.fm.documentsDirectory(), "lifeos_config.json");
    this.config = this.loadConfig();
    this.vaultPath = this.config.obsidianVaultPath || "";
  }}

  loadConfig() {{
    try {{
      if (this.fm.fileExists(this.configPath)) return JSON.parse(this.fm.readString(this.configPath));
    }} catch (e) {{}}
    return {{}};
  }}

  saveConfig(config) {{
    this.config = {{ ...this.config, ...config }};
    this.fm.writeString(this.configPath, JSON.stringify(this.config, null, 2));
    this.vaultPath = this.config.obsidianVaultPath || "";
  }}

  async handleRequest(request) {{
    let path = request.path || "/";
    const method = request.method || "GET";
    const body = request.body ? (typeof request.body === 'string' ? JSON.parse(request.body) : request.body) : null;
    const requestId = request.requestId;

    try {{
      let data = null;
      if (path === "/api/health") data = {{ status: "ok", platform: "ios" }};
      else if (path === "/api/config") data = this.config;
      else if (path === "/api/obsidian/files") data = await this.listVaultFiles(body?.recursive);
      else if (path.startsWith("/api/obsidian/files/")) {{
        const filePath = decodeURIComponent(path.replace("/api/obsidian/files/", ""));
        if (method === "GET") data = await this.readNote(filePath);
        else if (method === "PUT") data = await this.writeNote(filePath, body.content);
        else if (method === "DELETE") data = await this.deleteNote(filePath);
      }}
      else if (path === "/api/ai/universal") data = await this.universalAiRequest(body);
      else if (path === "/api/vault/search") data = await this.localSearch(body.query);
      else data = {{ status: "ok", message: "handled" }};
      return {{ requestId, data }};
    }} catch (error) {{
      return {{ requestId, error: error.message }};
    }}
  }}

  async listVaultFiles(recursive = false) {{
    if (!this.vaultPath) return {{ files: [], error: "No vault path" }};
    const results = [];
    const walk = (dir) => {{
      const items = this.fm.listContents(dir);
      for (const item of items) {{
        if (item.startsWith(".")) continue;
        const fullPath = this.fm.joinPath(dir, item);
        const relPath = fullPath.replace(this.vaultPath + "/", "");
        const isDir = this.fm.isDirectory(fullPath);
        results.push({{ path: relPath, is_dir: isDir }});
        if (recursive && isDir) walk(fullPath);
      }}
    }};
    walk(this.vaultPath);
    return {{ files: results }};
  }}

  async readNote(notePath) {{
    const fullPath = this.fm.joinPath(this.vaultPath, notePath);
    if (!this.fm.fileExists(fullPath)) throw new Error("Not found: " + notePath);
    return {{ content: this.fm.readString(fullPath), path: notePath, metadata: {{}} }};
  }}

  async writeNote(notePath, content) {{
    const fullPath = this.fm.joinPath(this.vaultPath, notePath);
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    if (!this.fm.fileExists(dir)) this.fm.createDirectory(dir, true);
    this.fm.writeString(fullPath, content);
    return {{ success: true }};
  }}

  async deleteNote(notePath) {{
    const fullPath = this.fm.joinPath(this.vaultPath, notePath);
    this.fm.remove(fullPath);
    return {{ success: true }};
  }}

  async localSearch(query) {{
    const allFiles = await this.listVaultFiles(true);
    const results = [];
    const regex = new RegExp(query, "i");
    for (const f of allFiles.files) {{
      if (!f.is_dir && f.path.endsWith(".md")) {{
        const content = this.fm.readString(this.fm.joinPath(this.vaultPath, f.path));
        if (regex.test(content) || regex.test(f.path)) results.push({{ path: f.path, score: 1 }});
      }}
    }}
    return {{ results }};
  }}

  async universalAiRequest(payload) {{
    const {{ provider, model, messages, system_prompt }} = payload;
    const apiKey = this.config.aiApiKey || this.config.geminiApiKey;
    if (!apiKey) throw new Error("API Key missing");
    let url = provider === "google" 
        ? `https://generativelanguage.googleapis.com/v1beta/models/${{model || "gemini-2.0-flash"}}:generateContent?key=${{apiKey}}`
        : (provider === "openai" ? "https://api.openai.com/v1/chat/completions" : 
           (provider === "groq" ? "https://api.groq.com/openai/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions"));
    let headers = {{ "Content-Type": "application/json" }};
    if (provider !== "google") headers["Authorization"] = `Bearer ${{apiKey}}`;
    let body = provider === "google" 
        ? {{ contents: [{{ role: "user", parts: [{{ text: system_prompt || "" }}] }}, ...messages.map(m => ({{ role: m.role === "assistant" ? "model" : "user", parts: [{{ text: m.content }}] }}))] }}
        : {{ model, messages: [{{ role: "system", content: system_prompt || "" }}, ...messages] }};
    const req = new Request(url);
    req.method = "POST";
    req.headers = headers;
    req.body = JSON.stringify(body);
    const res = await req.loadJSON();
    if (res.error) throw new Error(res.error.message || JSON.stringify(res.error));
    let text = provider === "google" ? res.candidates[0].content.parts[0].text : res.choices[0].message.content;
    return {{ response: text }};
  }}
}}

async function main() {{
  const backend = new NativeBackend();
  const wv = new WebView();
  wv.onMessage = async (msg) => {{
    try {{
      const request = JSON.parse(msg);
      if (request.type === "api_request") {{
        const response = await backend.handleRequest(request);
        wv.evaluateJavaScript(`window.LifeOS.onResponse("${{response.requestId}}", ${{JSON.stringify(response.data)}}, ${{JSON.stringify(response.error)}})`);
      }} else if (request.type === "update_config") {{
        backend.saveConfig(request);
      }} else if (request.type === "log") {{
        console.log(request.message);
      }}
    }} catch (e) {{
      console.log("Bridge Error: " + e.message);
    }}
  }};
  await wv.loadHTML(HTML_CONTENT);
  await wv.present(true);
}}
await main();
"""

    with open(template_path, "w") as f:
        f.write(scriptable_template)
    print(f"Successfully updated LifeOs_Mobile.js with Native Config Storage.")

if __name__ == "__main__":
    build_scriptable()
