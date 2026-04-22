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

    scriptable_template = """// LifeOS Mobile - Resilient Native Implementation
// Generated: __DATE__

const JS_B64 = "__JS_B64__";
const CSS_B64 = "__CSS_B64__";

const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <title>LifeOS Mobile</title>
  <script>
    (function() {
      // --- SHIMS ---
      const _OrigURL = window.URL;
      window.URL = function(url, base) {
        try {
          return new _OrigURL(url, base || "https://lifeos.local");
        } catch (e) {
          return { href: url, pathname: url, search: "", hash: "", origin: "https://lifeos.local" };
        }
      };
      window.URL.prototype = _OrigURL.prototype;
      window.URL.createObjectURL = _OrigURL.createObjectURL;
      window.URL.revokeObjectURL = _OrigURL.revokeObjectURL;

      const _oldFetch = window.fetch;
      window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : (input.url || "");
        if (url === "/" || url === "./" || url === "" || url.startsWith("blob:") || url.startsWith("https://lifeos.local")) {
          return Promise.resolve(new Response("", { status: 200, headers: { 'Content-Type': 'text/plain' } }));
        }
        return _oldFetch(input, init);
      };

      // --- POLLING BRIDGE ---
      window.lifeos_queue = [];
      window.LifeOS = {
        platform: "ios-scriptable",
        send: (type, data) => {
          const msg = JSON.stringify({ type, ...data });
          window.lifeos_queue.push(msg);
          
          // Still try the native way just in case
          try {
            if (typeof Scriptable !== 'undefined' && Scriptable.postMessage) {
              Scriptable.postMessage(msg);
            }
          } catch(e) {}
        },
        onResponse: (requestId, data, error) => {
          window.dispatchEvent(new CustomEvent('lifeos-api-response', { detail: { requestId, data, error } }));
        }
      };

      // --- CONSOLE PROXY ---
      const _log = console.log;
      console.log = (...args) => {
        _log(...args);
        window.LifeOS.send('log', { message: args.map(String).join(' ') });
      };
      console.error = (...args) => {
        window.LifeOS.send('log', { message: '[ERROR] ' + args.map(String).join(' ') });
      };
    })();
  </script>
  <style id="main-style"></style>
</head>
<body style="margin: 0; padding: 0; background: #000; overflow: hidden; position: fixed; width: 100%; height: 100%;">
  <div id="root"></div>
  <div id="boot-loader" style="position:fixed; inset:0; background:#000; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:10000; font-family:-apple-system, system-ui, sans-serif;">
    <div style="width:32px; height:32px; border:2px solid rgba(255,255,255,0.05); border-top-color:#fff; border-radius:50%; animation:spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;"></div>
    <div style="margin-top:24px; font-size:10px; font-weight:700; letter-spacing:0.5em; color:#666; text-transform:uppercase;">Initializing_LifeOS</div>
  </div>
  <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  <script>
    (function() {
      try {
        document.getElementById('main-style').innerHTML = atob("__CSS_B64__");
        
        const script = document.createElement('script');
        // Use a more robust decoding for UTF-8
        const b64 = "__JS_B64__";
        const decodedJs = decodeURIComponent(escape(atob(b64)));
        script.innerHTML = decodedJs;
        document.body.appendChild(script);
        
        setTimeout(() => {
          const loader = document.getElementById('boot-loader');
          if (loader) loader.style.opacity = '0';
          setTimeout(() => loader?.remove(), 500);
        }, 1000);
      } catch (e) {
        console.error('BOOT_FAIL: ' + e.message);
        document.getElementById('boot-loader').innerHTML = 
          '<div style="padding:40px; color:#ff4444; font-size:14px; font-family:monospace; text-align:center;">' +
          '<div style="font-weight:bold; margin-bottom:10px;">CORE_INIT_FAILURE</div>' +
          '<div style="opacity:0.8;">' + e.message + '</div>' +
          '</div>';
      }
    })();
  </script>
</body>
</html>
`;

class NativeBackend {
  constructor() {
    this.fm = FileManager.local();
    this.documentsDir = this.fm.documentsDirectory();
    this.configPath = this.fm.joinPath(this.documentsDir, "lifeos_config.json");
    this.config = this.loadConfig();
    this.vaultPath = this.config.obsidianVaultPath || "";
    
    console.log("[Native] Initialized. Documents: " + this.documentsDir);
  }

  loadConfig() {
    try {
      if (this.fm.fileExists(this.configPath)) {
        const content = this.fm.readString(this.configPath);
        return JSON.parse(content);
      }
    } catch (e) {
      console.log("[Native] Config load error: " + e.message);
    }
    return {};
  }

  saveConfig(configUpdate) {
    const { type, ...updates } = configUpdate;
    this.config = { ...this.config, ...updates };
    try {
      this.fm.writeString(this.configPath, JSON.stringify(this.config, null, 2));
      this.vaultPath = this.config.obsidianVaultPath || "";
      console.log("[Native] Config saved. Vault: " + this.vaultPath);
    } catch (e) {
      console.log("[Native] Config save error: " + e.message);
    }
  }

  async listDatabases() {
    const academicPath = this.config.academicFolderPath || "1-Academic";
    const fm = this.getFM(this.vaultPath);
    const root = fm.joinPath(this.vaultPath, academicPath);
    if (!fm.fileExists(root)) return { databases: [] };
    
    const items = fm.listContents(root);
    const dbs = [];
    for (const item of items) {
      if (item.startsWith(".")) continue;
      const fullPath = fm.joinPath(root, item);
      if (fm.isDirectory(fullPath)) {
        dbs.push({ id: item, title: item.replace(/_/g, ' '), path: academicPath + "/" + item });
      }
    }
    return { databases: dbs };
  }

  async listDatabaseUnits(dbId) {
    const academicPath = this.config.academicFolderPath || "1-Academic";
    const fm = this.getFM(this.vaultPath);
    const dbPath = fm.joinPath(this.vaultPath, academicPath + "/" + dbId);
    const unitsPath = fm.joinPath(dbPath, "Units");
    if (!fm.fileExists(unitsPath)) return { results: [] };
    
    const items = fm.listContents(unitsPath);
    const units = items.filter(i => i.endsWith(".md")).map(i => ({ 
      id: i, 
      title: i.replace(".md", "").replace(/_/g, ' '),
      path: academicPath + "/" + dbId + "/Units/" + i
    }));
    return { results: units };
  }

  async getDatabaseStats(dbId) {
    return {
      activeCount: 12,
      pendingCount: 5,
      masteryLevel: 68
    };
  }

  async handleRequest(request) {
    let path = request.path || "/";
    const method = request.method || "GET";
    const body = request.body ? (typeof request.body === 'string' ? JSON.parse(request.body) : request.body) : null;
    const requestId = request.requestId;

    try {
      let data = null;
      if (path === "/api/health") data = { status: "ok", platform: "ios", timestamp: new Date().toISOString() };
      else if (path === "/api/config") {
        if (method === "POST" || method === "PUT") {
          this.saveConfig(body);
          data = this.config;
        } else {
          data = this.config;
        }
      }
      else if (path === "/api/vault/databases") data = await this.listDatabases();
      else if (path.startsWith("/api/vault/databases/") && path.endsWith("/units")) {
        const dbId = path.split('/')[4];
        data = await this.listDatabaseUnits(decodeURIComponent(dbId));
      }
      else if (path.startsWith("/api/vault/databases/")) {
        const dbId = path.split('/')[4];
        data = await this.getDatabaseStats(decodeURIComponent(dbId));
      }
      else if (path === "/api/obsidian/pick-folder") {
        data = await this.pickVaultFolder();
      }
      else if (path === "/api/obsidian/files") data = await this.listVaultFiles(body?.recursive);
      else if (path.startsWith("/api/obsidian/files/binary/")) {
        const filePath = decodeURIComponent(path.replace("/api/obsidian/files/binary/", ""));
        data = await this.readBinaryFile(filePath);
      }
      else if (path.startsWith("/api/obsidian/files/")) {
        const filePath = decodeURIComponent(path.replace("/api/obsidian/files/", ""));
        if (method === "GET") data = await this.readNote(filePath);
        else if (method === "PUT") data = await this.writeNote(filePath, body.content);
        else if (method === "DELETE") data = await this.deleteNote(filePath);
      }
      else if (path === "/api/ai/universal") data = await this.universalAiRequest(body);
      else if (path === "/api/vault/search") data = await this.localSearch(body.query);
      else {
        console.log("[Native] Unhandled API path: " + path);
        data = { status: "error", message: "Not implemented: " + path };
      }
      return { requestId, data };
    } catch (error) {
      console.log("[Native] Request Error [" + path + "]: " + error.message);
      return { requestId, error: error.message };
    }
  }

  async readBinaryFile(filePath) {
    const fm = this.getFM(this.vaultPath);
    const fullPath = fm.joinPath(this.vaultPath, filePath);
    if (!fm.fileExists(fullPath)) throw new Error("File not found: " + filePath);
    
    // In Scriptable, fm.read returns a Data object
    const data = fm.read(fullPath);
    const b64 = data.toBase64String();
    
    // Determine mime type
    const ext = filePath.split('.').pop().toLowerCase();
    let mime = "application/octet-stream";
    if (ext === "pdf") mime = "application/pdf";
    else if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) mime = "image/" + (ext === "jpg" ? "jpeg" : ext);
    
    return { data: b64, mime: mime };
  }

  async pickVaultFolder() {
    console.log("[Native] Opening folder picker...");
    try {
      const path = await DocumentPicker.openFolder();
      console.log("[Native] Selected path: " + path);
      this.config.obsidianVaultPath = path;
      this.vaultPath = path;
      this.saveConfig(this.config);
      return { success: true, path: path };
    } catch (e) {
      console.log("[Native] Folder pick error: " + e.message);
      return { success: false, error: e.message };
    }
  }

  getFM(path) {
    const isCloud = path && (path.includes("com~apple~CloudDocs") || path.includes("Mobile Documents") || path.includes("iCloud"));
    const fm = isCloud ? FileManager.iCloud() : FileManager.local();
    return fm;
  }

  async listVaultFiles(recursive = false) {
    console.log("[Native] Listing files for: " + this.vaultPath);
    if (!this.vaultPath) return { files: [], error: "No vault path configured" };
    
    const fm = this.getFM(this.vaultPath);
    
    // Check if iCloud file needs downloading or if it's accessible
    try {
      if (!fm.fileExists(this.vaultPath)) {
        console.log("[Native] Vault path does not exist: " + this.vaultPath);
        return { files: [], error: "Path not found" };
      }
      if (!fm.isDirectory(this.vaultPath)) {
        console.log("[Native] Vault path is not a directory: " + this.vaultPath);
        return { files: [], error: "Not a directory" };
      }
    } catch (e) {
      console.log("[Native] FM Check Error: " + e.message);
      return { files: [], error: e.message };
    }
    
    const results = [];
    const walk = (dir) => {
      const items = fm.listContents(dir);
      for (const item of items) {
        if (item.startsWith(".")) continue;
        const fullPath = fm.joinPath(dir, item);
        const relPath = fullPath.replace(this.vaultPath + "/", "");
        const isDir = fm.isDirectory(fullPath);
        results.push({ name: item, path: relPath, is_dir: isDir });
        if (recursive && isDir) walk(fullPath);
      }
    };
    walk(this.vaultPath);
    return { files: results };
  }

  async readNote(notePath) {
    const fm = this.getFM(this.vaultPath);
    const fullPath = fm.joinPath(this.vaultPath, notePath);
    if (!fm.fileExists(fullPath)) throw new Error("File not found: " + notePath);
    
    const content = fm.readString(fullPath);
    let metadata = {};
    
    // Simple regex-based YAML parser
    const yamlMatch = content.match(/^---\\n([\\s\\S]*?)\\n---/);
    if (yamlMatch) {
      const yamlLines = yamlMatch[1].split('\\n');
      for (const line of yamlLines) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          metadata[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    }
    
    return { content, path: notePath, metadata };
  }

  async writeNote(notePath, content) {
    const fm = this.getFM(this.vaultPath);
    const fullPath = fm.joinPath(this.vaultPath, notePath);
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    if (!fm.fileExists(dir)) fm.createDirectory(dir, true);
    fm.writeString(fullPath, content);
    return { success: true };
  }

  async deleteNote(notePath) {
    const fm = this.getFM(this.vaultPath);
    const fullPath = fm.joinPath(this.vaultPath, notePath);
    if (fm.fileExists(fullPath)) {
      fm.remove(fullPath);
    }
    return { success: true };
  }

  async localSearch(query) {
    const fm = this.getFM(this.vaultPath);
    const allFiles = await this.listVaultFiles(true);
    const results = [];
    const regex = new RegExp(query, "i");
    for (const f of allFiles.files) {
      if (!f.is_dir && f.path.endsWith(".md")) {
        const content = fm.readString(fm.joinPath(this.vaultPath, f.path));
        if (regex.test(content) || regex.test(f.path)) {
          results.push({ path: f.path, score: 1 });
        }
      }
    }
    return { results };
  }

  async universalAiRequest(payload) {
    const { provider, model, messages, system_prompt } = payload;
    const apiKey = this.config.aiApiKey || this.config.geminiApiKey;
    if (!apiKey) throw new Error("AI API Key missing in config");
    
    let url = provider === "google" 
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-2.0-flash"}:generateContent?key=${apiKey}`
        : (provider === "openai" ? "https://api.openai.com/v1/chat/completions" : 
           (provider === "groq" ? "https://api.groq.com/openai/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions"));
    
    let headers = { "Content-Type": "application/json" };
    if (provider !== "google") headers["Authorization"] = `Bearer ${apiKey}`;
    
    let body = provider === "google" 
        ? { contents: [{ role: "user", parts: [{ text: system_prompt || "" }] }, ...messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }))] }
        : { model, messages: [{ role: "system", content: system_prompt || "" }, ...messages] };
    
    const req = new Request(url);
    req.method = "POST";
    req.headers = headers;
    req.body = JSON.stringify(body);
    
    const res = await req.loadJSON();
    if (res.error) throw new Error(res.error.message || JSON.stringify(res.error));
    
    let text = provider === "google" 
      ? (res.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI")
      : (res.choices?.[0]?.message?.content || "No response from AI");
      
    return { response: text };
  }
}

function sleep(ms) {
  return new Promise(resolve => Timer.schedule(ms, false, resolve));
}

async function main() {
  const backend = new NativeBackend();
  const wv = new WebView();
  console.log("[Native] WebView instance created");
  
  const handleMessage = async (msg) => {
    try {
      const request = JSON.parse(msg);
      if (request.type === "api_request") {
        console.log("[Native] Processing request: " + request.path);
        const response = await backend.handleRequest(request);
        const js = "if(window.LifeOS) { window.LifeOS.onResponse(" + 
                   JSON.stringify(response.requestId) + ", " + 
                   JSON.stringify(response.data) + ", " + 
                   JSON.stringify(response.error) + "); }";
        wv.evaluateJavaScript(js);
        console.log("[Native] Response sent for: " + request.path);
      } else if (request.type === "update_config") {
        const { type, ...configOnly } = request;
        backend.saveConfig(configOnly);
      } else if (request.type === "log") {
        console.log("[WebView] " + request.message);
      }
    } catch (e) {
      console.log("[Bridge Error] " + e.message);
    }
  };

  wv.onMessage = (msg) => {
    console.log("[Native] Incoming message: " + msg);
    handleMessage(msg);
  };
  
  await wv.loadHTML(HTML_CONTENT);
  console.log("[Native] WebView HTML loaded");
  
  // Start polling loop as fallback
  const pollingLoop = async () => {
    console.log("[Native] Polling loop started");
    while (true) {
      try {
        const msg = await wv.evaluateJavaScript("window.lifeos_queue ? window.lifeos_queue.shift() : null");
        if (msg) {
          console.log("[Native] Polled message: " + msg);
          handleMessage(msg);
        }
      } catch (e) {
        // console.log("[Poll Error] " + e.message);
      }
      await sleep(100);
    }
  };

  pollingLoop();
  await wv.present(true);
}

await main();
""".replace("__JS_B64__", js_b64).replace("__CSS_B64__", css_b64).replace("__DATE__", os.popen('date "+%Y-%m-%d %H:%M"').read().strip())

    with open(template_path, "w") as f:
        f.write(scriptable_template)
    print(f"Successfully updated LifeOs_Mobile.js with Native Config Storage.")

if __name__ == "__main__":
    build_scriptable()
