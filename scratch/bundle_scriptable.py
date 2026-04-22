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

  async listVaultDatabases() {
    console.log("[Native] Listing Databases...");
    const fm = this.getFM(this.vaultPath);
    const dbRoot = fm.joinPath(this.vaultPath, "3-Database");
    if (!fm.fileExists(dbRoot)) return { databases: [] };
    
    const folders = fm.listContents(dbRoot);
    const databases = [];
    for (const folder of folders) {
      if (folder.startsWith(".")) continue;
      const fullPath = fm.joinPath(dbRoot, folder);
      if (fm.isDirectory(fullPath)) {
        const contents = fm.listContents(fullPath).filter(f => !f.startsWith(".") && f.endsWith(".md"));
        let schema = {};
        if (contents.length > 0) {
          try {
            const firstNote = await this.readNote("3-Database/" + folder + "/" + contents[0]);
            schema = firstNote.metadata || {};
          } catch(e) {}
        }
        databases.push({
          id: folder,
          name: folder.replace(/^[0-9]+\\\\s*-\\s*/, ""),
          path: "3-Database/" + folder,
          schema: schema,
          count: contents.length
        });
      }
    }
    return { databases };
  }

  async listDatabaseUnits(dbId) {
    const fm = this.getFM(this.vaultPath);
    const dbPath = fm.joinPath(this.vaultPath, "3-Database/" + dbId);
    if (!fm.fileExists(dbPath)) return { results: [] };
    const items = fm.listContents(dbPath);
    const results = items.filter(f => !f.startsWith(".") && f.endsWith(".md")).map(f => ({
      id: f,
      title: f.replace(".md", "").replace(/_/g, " "),
      path: "3-Database/" + dbId + "/" + f
    }));
    return { results };
  }

  async createVaultRow(dbId, title, options) {
    console.log("[Native] Creating row: " + title + " in DB: " + dbId);
    const fm = this.getFM(this.vaultPath);
    const dbPath = fm.joinPath(this.vaultPath, "3-Database/" + dbId);
    if (!fm.fileExists(dbPath)) fm.createDirectory(dbPath, true);
    
    const fileName = title.replace(/[^a-z0-9\\\\s]/gi, '_').replace(/\\\\s+/g, '_') + ".md";
    const fullPath = fm.joinPath(dbPath, fileName);
    
    let content = "---\\ntitle: " + title + "\\n---";
    if (options.template) {
      try {
        const templateFull = fm.joinPath(this.vaultPath, options.template);
        if (fm.fileExists(templateFull)) {
          content = fm.readString(templateFull);
          // Simple title replacement if found
          content = content.replace(/title: .*/, "title: " + title);
        }
      } catch (e) {}
    }
    
    fm.writeString(fullPath, content);
    return { success: true, path: "3-Database/" + dbId + "/" + fileName };
  }

  async updateVaultRow(dbId, rowId, updates) {
    console.log("[Native] Updating row: " + rowId + " in DB: " + dbId);
    const fm = this.getFM(this.vaultPath);
    const relPath = "3-Database/" + dbId + "/" + rowId;
    const fullPath = fm.joinPath(this.vaultPath, relPath);
    if (!fm.fileExists(fullPath)) throw new Error("Row not found: " + relPath);
    
    let content = fm.readString(fullPath);
    let frontmatter = {};
    const yamlMatch = content.match(/^---\\n([\\\\s\\\\S]*?)\\n---/);
    
    if (yamlMatch) {
      const lines = yamlMatch[1].split('\\n');
      for (const line of lines) {
        const [k, ...v] = line.split(':');
        if (k && v.length) frontmatter[k.trim()] = v.join(':').trim();
      }
      
      frontmatter = { ...frontmatter, ...updates };
      const newYaml = Object.entries(frontmatter).map(([k, v]) => `${k}: ${v}`).join('\\n');
      content = content.replace(/^---\\n[\\\\s\\\\S]*?\\n---/, `---\\n${newYaml}\\n---`);
    } else {
      // No frontmatter, create one
      const newYaml = Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join('\\n');
      content = `---\\n${newYaml}\\n---\\n\\n` + content;
    }
    
    fm.writeString(fullPath, content);
    return { success: true };
  }

  async deleteVaultRow(dbId, rowId) {
    console.log("[Native] Deleting row: " + rowId + " in DB: " + dbId);
    const fm = this.getFM(this.vaultPath);
    const relPath = "3-Database/" + dbId + "/" + rowId;
    const fullPath = fm.joinPath(this.vaultPath, relPath);
    if (fm.fileExists(fullPath)) fm.remove(fullPath);
    return { success: true };
  }

  async listVaultTemplates() {
    const fm = this.getFM(this.vaultPath);
    const templatePath = fm.joinPath(this.vaultPath, "8-System/Templates");
    if (!fm.fileExists(templatePath)) return { templates: [] };
    const items = fm.listContents(templatePath);
    return { templates: items.filter(f => f.endsWith(".md")).map(f => ({ name: f.replace(".md", ""), path: "8-System/Templates/" + f })) };
  }

  async getVaultStats() {
    const allFiles = await this.listVaultFiles(true);
    const mdFiles = allFiles.files.filter(f => !f.is_dir && f.path.endsWith(".md"));
    const pdfFiles = allFiles.files.filter(f => !f.is_dir && f.path.endsWith(".pdf"));
    return {
      totalNotes: mdFiles.length,
      totalAssets: pdfFiles.length,
      vaultSize: "Unknown",
      lastSync: new Date().toISOString()
    };
  }

  async pickFileToInbox() {
    try {
      console.log("[Native] Picking file to inbox...");
      const paths = await DocumentPicker.openFile();
      if (!paths || paths.length === 0) return { success: false, message: "No file selected" };
      
      const fm = this.getFM(this.vaultPath);
      const inboxPath = this.config.okaInboxPath || "9-OKA/Inbox";
      const fullInbox = fm.joinPath(this.vaultPath, inboxPath);
      if (!fm.fileExists(fullInbox)) fm.createDirectory(fullInbox, true);
      
      for (const p of paths) {
        const fileName = p.split('/').pop();
        const dest = fm.joinPath(fullInbox, fileName);
        fm.copy(p, dest);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
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
      else if (path === "/api/obsidian/files") data = await this.listVaultFiles(body?.recursive);
      else if (path === "/api/obsidian/pick-folder") data = await this.pickVaultFolder();
      else if (path === "/api/test-ai") data = await this.testAiConnection(body);
      else if (path === "/api/vault/stats") data = await this.getVaultStats();
      else if (path === "/api/vault/databases") data = await this.listVaultDatabases();
      else if (path.startsWith("/api/vault/databases/")) {
        const parts = path.split('/');
        const dbId = decodeURIComponent(parts[4]);
        if (path.endsWith("/units")) data = await this.listDatabaseUnits(dbId);
        else if (path.endsWith("/stats")) data = await this.getDatabaseStats(dbId);
        else if (path.endsWith("/create")) data = await this.createVaultRow(dbId, body.title, body);
        else if (path.includes("/rows/")) {
          const rowId = decodeURIComponent(parts[6]);
          if (method === "PUT") data = await this.updateVaultRow(dbId, rowId, body);
          else if (method === "DELETE") data = await this.deleteVaultRow(dbId, rowId);
        }
        else data = { id: dbId, title: dbId.replace(/_/g, " ") };
      }
      else if (path === "/api/vault/templates") data = await this.listVaultTemplates();
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
      else if (path.startsWith("/api/vault/backlinks")) {
        const urlMatch = path.match(/pageName=(.*)/);
        const pageName = urlMatch ? decodeURIComponent(urlMatch[1]) : "";
        data = await this.getBacklinks(pageName);
      }
      else if (path.startsWith("/api/ai/specialists/")) {
        const specialist = path.split("/").pop();
        data = { status: "active", name: specialist, message: "Specialist system operational." };
      }
      else if (path === "/api/ai/chronos/timeline") {
        data = []; // Stub for timeline
      }
      else if (path.startsWith("/api/practice/")) {
        if (path === "/api/practice/list") data = await this.practiceList();
        else if (path === "/api/practice/generate") data = await this.practiceGenerate(body.hub_id, body.config);
        else if (path === "/api/practice/get") data = await this.practiceGet(body.path);
        else if (path === "/api/practice/score") data = await this.practiceUpdateScore(body.path, body.score);
        else if (path === "/api/practice/delete") data = await this.practiceDelete(body.path);
      }
      else if (path.startsWith("/api/oka/")) {
        // Specialized OKA handling for mobile
        if (path === "/api/oka/process") data = await this.okaProcess(body);
        else if (path === "/api/oka/explain") data = await this.okaExplain(body);
        else if (path === "/api/oka/quick-questions") data = await this.okaExplain(body); // Use explain as fallback
        else if (path === "/api/oka/interactive-quiz") data = await this.okaQuiz(body);
        else if (path === "/api/oka/chat") data = await this.okaChat(body);
        else if (path === "/api/academics/dashboard") data = { gpa: "N/A", credits: 0, status: "Active", units: [] };
        else if (path === "/api/oka/inbox") data = await this.okaListInbox();
        else if (path === "/api/oka/generated") data = await this.okaListGenerated();
        else if (path === "/api/oka/pick-to-inbox") data = await this.pickFileToInbox();
        else if (path === "/api/oka/hubs") data = await this.okaListHubs();
        else if (path.includes("/notes") && path.startsWith("/api/oka/hubs/")) {
          const hubId = path.split("/")[4];
          data = await this.okaListHubNotes(decodeURIComponent(hubId));
        }
        else if (path === "/api/oka/queue/status" || path === "/api/oka/watcher/status") {
          data = { status: "idle", is_running: true, pending_count: 0, inbox: this.config.okaInboxPath || "9-OKA/Inbox" };
        }
        else if (path === "/api/oka/plan") data = { session_id: "mobile-" + Date.now(), plan_structured: { batches: [] }, status: "detected" };
        else if (path === "/api/oka/confirm") data = { status: "success", current_batch: 1, has_more: false, results: [] };
        else data = { status: "idle", message: "OKA Sub-system active via Proxy" };
      }
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

  async okaListHubs() {
    console.log("[Native] Listing Hubs...");
    const fm = this.getFM(this.vaultPath);
    const plannerPath = fm.joinPath(this.vaultPath, "3-Database/06 - Study Planner");
    if (!fm.fileExists(plannerPath)) return { hubs: [] };
    
    const files = fm.listContents(plannerPath).filter(f => f.endsWith(".md") && !f.startsWith("_"));
    const hubs = [];
    for (const file of files) {
      const content = fm.readString(fm.joinPath(plannerPath, file));
      const metadata = this.parseYaml(content);
      hubs.push({
        id: file,
        title: file.replace(".md", "").replace(/_/g, " "),
        path: "3-Database/06 - Study Planner/" + file,
        course: metadata.course || metadata.Course || "General",
        unit: metadata.unit || metadata.Unit || ""
      });
    }
    return { hubs };
  }

  async okaListHubNotes(hubId) {
    console.log("[Native] Resolving Notes for Hub: " + hubId);
    const fm = this.getFM(this.vaultPath);
    const hubs = await this.okaListHubs();
    const hub = hubs.hubs.find(h => h.id === hubId);
    if (!hub) return { notes: [] };

    // Try to find notes in the '2-Registry' folder which is standard for atomic notes
    const allFiles = await this.listVaultFiles(true);
    let notes = allFiles.files.filter(f => 
      !f.is_dir && 
      f.path.endsWith(".md") && 
      (f.path.includes("2-Registry") || f.path.includes("1-Input")) &&
      !f.path.includes("Practice")
    );
    
    // If we have course/unit info, filter by it in the path
    if (hub.course) {
      const courseFilter = hub.course.toLowerCase();
      const relevant = notes.filter(n => n.path.toLowerCase().includes(courseFilter));
      if (relevant.length > 0) notes = relevant;
    }

    return { notes: notes.slice(0, 100) };
  }

  async practiceList() {
    const fm = this.getFM(this.vaultPath);
    const practicePath = fm.joinPath(this.vaultPath, "9-OKA/Practice");
    if (!fm.fileExists(practicePath)) return { practices: [] };
    
    const files = fm.listContents(practicePath).filter(f => f.endsWith(".md"));
    const practices = [];
    for (const file of files) {
      const content = fm.readString(fm.joinPath(practicePath, file));
      const metadata = this.parseYaml(content);
      if (metadata.type === "practice") {
        practices.push({
          id: file,
          path: "9-OKA/Practice/" + file,
          hub_id: metadata.hub_id,
          hub_title: metadata.hub_id ? metadata.hub_id.replace(".md", "").replace(/_/g, " ") : "Core Synthesis",
          date: metadata.date,
          score: metadata.score ? metadata.score.replace("%", "") : 0,
          completed: metadata.completed || false
        });
      }
    }
    return { practices };
  }

  async practiceGet(path) {
    const note = await this.readNote(path);
    const jsonMatch = note.content.match(/```json\\\\n([\\\\s\\\\S]*?)\\\\n```/);
    if (jsonMatch) {
      try {
        const questions = JSON.parse(jsonMatch[1]);
        return { questions, ...note.metadata };
      } catch (e) {}
    }
    return { questions: [], error: "No structured data found" };
  }

  async practiceUpdateScore(path, score) {
    const note = await this.readNote(path);
    let content = note.content;
    const scoreStr = score + "%";
    
    if (content.includes("score:")) {
      content = content.replace(/score: .*/, "score: " + scoreStr);
    } else {
      content = content.replace("---", "---\\nscore: " + scoreStr);
    }
    
    if (content.includes("completed:")) {
      content = content.replace(/completed: .*/, "completed: true");
    } else {
      content = content.replace("---", "---\\ncompleted: true");
    }
    
    await this.writeNote(path, content);
    return { success: true };
  }

  async practiceDelete(path) {
    return await this.deleteNote(path);
  }

  async practiceGenerate(hubId, config) {
    console.log("[Native] Generating Sovereign Practice Session...");
    const fm = this.getFM(this.vaultPath);
    
    // 1. Gather context from hub
    const hub = await this.readNote("3-Database/06 - Study Planner/" + hubId);
    let context = "HUB_TOPIC: " + hubId + "\\\\n\\\\nCONTENT_PREVIEW:\\\\n" + hub.content.substring(0, 3000);
    
    // 2. Refined Pedagogical Prompt
    const prompt = `You are OKA, the Sovereign Pedagogical Architect. Your mission is to construct a High-Fidelity Retrieval Session.\\\\n\\\\n` +
                   `TARGET_HUB: ${hubId}\\\\n` +
                   `PEDAGOGICAL_PARAMETERS:\\\\n` +
                   `- Difficulty: ${config.difficulty || 'L1'}\\\\n` +
                   `- Distribution: ${JSON.stringify(config.questionDistribution)}\\\\n` +
                   `- Strictness: ${config.gradingStrictness || 'Standard'}\\\\n\\\\n` +
                   `SOURCE_CONTEXT:\\\\n${context}\\\\n\\\\n` +
                   `CONSTRUCTION_RULES:\\\\n` +
                   `1. Generate a "questions" array within a JSON object.\\\\n` +
                   `2. Types allowed: "mcq", "true_false", "short_answer".\\\\n` +
                   `3. Each MCQ must have 4 plausible distractors (options A, B, C, D).\\\\n` +
                   `4. Each question MUST have a "explanation" field detailing the "Why" behind the correct answer.\\\\n` +
                   `5. Ensure all questions are unique and map to core concepts in the context.\\\\n` +
                   `6. RETURN ONLY THE JSON OBJECT. NO MARKDOWN TAGS.`;
    
    const aiRes = await this.universalAiRequest({ 
      provider: this.config.plannerProvider || this.config.aiProvider || "google",
      model: this.config.plannerModel || this.config.aiModel || "gemini-2.0-flash",
      apiKey: this.config.plannerApiKey || this.config.aiApiKey || this.config.geminiApiKey,
      messages: [{ role: "user", content: prompt }],
      system_prompt: "You are the LifeOS Retrieval Specialist. You output ONLY structured JSON data. No conversational filler." 
    });

    try {
      let rawJson = aiRes.response.trim();
      
      // Robust Extraction: Try to find JSON inside code blocks first
      const codeBlockMatch = rawJson.match(/```(?:json)?\\\\n?([\\\\s\\\\S]*?)```/i);
      if (codeBlockMatch) {
        rawJson = codeBlockMatch[1].trim();
      } else {
        // Fallback: Try to find anything between the first { and the last }
        const bracketMatch = rawJson.match(/(\\{[\\\\s\\\\S]*\\})/);
        if (bracketMatch) {
          rawJson = bracketMatch[1].trim();
        }
      }
      
      const questionsData = JSON.parse(rawJson);
      let questions = Array.isArray(questionsData.questions) ? questionsData.questions : (Array.isArray(questionsData) ? questionsData : []);
      
      // Ensure every question has an ID for React keys
      questions = questions.map((q, idx) => ({
        ...q,
        id: q.id || `q-${idx}-${Date.now()}`
      }));

      if (questions.length === 0) throw new Error("No questions generated by AI.");

      // 3. Save to vault for persistence
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `Practice_${hubId.replace(".md", "")}_${timestamp}.md`;
      const relPath = "9-OKA/Practice/" + fileName;
      
      const mdContent = `---\\ntype: practice\\nhub_id: ${hubId}\\ndate: ${new Date().toISOString().split('T')[0]}\\ndifficulty: ${config.difficulty}\\nscore: null\\ncompleted: false\\n---\\n\\n# Practice Session: ${hubId.replace(".md", "")}\\n\\n` +
                        "```json\\n" + JSON.stringify({ questions }, null, 2) + "\\n```";
      
      await this.writeNote(relPath, mdContent);
      return { questions, quiz_path: relPath };
    } catch (e) {
      console.log("[Native] Practice generation failure: " + e.message);
      throw e;
    }
  }

  parseYaml(content) {
    const metadata = {};
    const yamlMatch = content.match(/^---\\n([\\\\s\\\\S]*?)\\n---/);
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
    return metadata;
  }

  async okaListInbox() {
    const inboxPath = this.config.okaInboxPath || "9-OKA/Inbox";
    const fm = this.getFM(this.vaultPath);
    const fullPath = fm.joinPath(this.vaultPath, inboxPath);
    if (!fm.fileExists(fullPath)) return { files: [] };
    const items = fm.listContents(fullPath);
    return { files: items.filter(i => !i.startsWith(".")).map(i => ({ name: i, path: inboxPath + "/" + i })) };
  }

  async okaListGenerated() {
    const inboxPath = this.config.okaInboxPath || "9-OKA/Inbox";
    const genPath = inboxPath + "/note generated";
    const fm = this.getFM(this.vaultPath);
    const fullPath = fm.joinPath(this.vaultPath, genPath);
    if (!fm.fileExists(fullPath)) return { files: [] };
    const items = fm.listContents(fullPath);
    return { files: items.filter(i => !i.startsWith(".")).map(i => ({ name: i, path: genPath + "/" + i })) };
  }

  async getBacklinks(pageName) {
    if (!pageName) return { backlinks: [] };
    console.log("[Native] Resolving backlinks for: " + pageName);
    const fm = this.getFM(this.vaultPath);
    const allFiles = await this.listVaultFiles(true);
    const backlinks = [];
    const escapedPage = pageName.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, "\\\\$&");
    const wikiLinkRegex = new RegExp(`\\\\[\\\\[${escapedPage}(\\\\|.*?)?\\\\]\\\\]`, "i");
    for (const f of allFiles.files) {
      if (!f.is_dir && f.path.endsWith(".md")) {
        try {
          const content = fm.readString(fm.joinPath(this.vaultPath, f.path));
          if (content && wikiLinkRegex.test(content)) {
            backlinks.push({ path: f.path, name: f.name.replace(".md", "").replace(/_/g, " ") });
          }
        } catch (e) {}
      }
    }
    return { backlinks };
  }

  async okaProcess(payload) {
    const { text, file_path, plan } = payload;
    let content = text;
    if (!content && file_path) {
      const note = await this.readNote(file_path);
      content = note.content;
    }
    if (!content && !plan) return { error: "No content or plan provided" };
    console.log("[Native] OKA Processing...");
    if (plan) {
      return { status: "success", message: "Plan deployment simulated on mobile.", results: [{ type: "hub", title: "Anchored Hub Created" }] };
    }
    const prompt = "Summarize the following technical note for a pedagogical vault. " +
                   "Focus on core concepts and relationships. Then generate 3 Socratic discovery questions. " +
                   "Format as markdown. \\\\n\\\\nContent:\\\\n" + content;
    const res = await this.universalAiRequest({ messages: [{ role: "user", content: prompt }] });
    return { status: "success", summary: res.response, questions: ["How does this relate to previous units?", "What is the edge case here?"] };
  }

  async okaExplain(payload) {
    const { selection, path, page } = payload;
    const prompt = `Explain this selection from the document "${path}" (Page ${page || 1}):\\\\n\\\\n"${selection}"\\\\n\\\\nProvide a high-fidelity, pedagogical explanation.`;
    const aiRes = await this.universalAiRequest({ messages: [{ role: "user", content: prompt }] });
    return { answer: aiRes.response };
  }

  async okaQuiz(payload) {
    const { selection } = payload;
    const prompt = `Based on the following text, generate 3 high-quality multiple-choice questions for retrieval practice.\\\\n\\\\nTEXT:\\\\n"${selection}"\\\\n\\\\nFormat the output as a JSON object with a "questions" array. Each question should have:\\\\n- question: string\\\\n- options: string[]\\\\n- answer: string (must be one of the options)\\\\n- explanation: string`;
    const aiRes = await this.universalAiRequest({ messages: [{ role: "user", content: prompt }], system_prompt: "You are the LifeOS Retrieval Specialist. Return ONLY valid JSON." });
    try {
      const cleaned = aiRes.response.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (e) { return { questions: [] }; }
  }

  async okaChat(payload) {
    const { selection, messages } = payload;
    const aiRes = await this.universalAiRequest({ messages: messages, system_prompt: `You are discussing the following selection: "${selection}". Help the user explore the topic deeper.` });
    return { answer: aiRes.response };
  }

  async readBinaryFile(filePath) {
    const fm = this.getFM(this.vaultPath);
    const fullPath = fm.joinPath(this.vaultPath, filePath);
    if (!fm.fileExists(fullPath)) throw new Error("File not found: " + filePath);
    const data = fm.read(fullPath);
    const b64 = data.toBase64String();
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
      this.config.obsidianVaultPath = path;
      this.vaultPath = path;
      this.saveConfig(this.config);
      return { success: true, path: path };
    } catch (e) { return { success: false, error: e.message }; }
  }

  getFM(path) {
    const isCloud = path && (path.includes("com~apple~CloudDocs") || path.includes("Mobile Documents") || path.includes("iCloud"));
    return isCloud ? FileManager.iCloud() : FileManager.local();
  }

  async listVaultFiles(recursive = false) {
    if (!this.vaultPath) return { files: [], error: "No vault path configured" };
    const fm = this.getFM(this.vaultPath);
    try {
      if (!fm.fileExists(this.vaultPath)) return { files: [], error: "Path not found" };
      if (!fm.isDirectory(this.vaultPath)) return { files: [], error: "Not a directory" };
    } catch (e) { return { files: [], error: e.message }; }
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
    const yamlMatch = content.match(/^---\\n([\\\\s\\\\S]*?)\\n---/);
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
    if (fm.fileExists(fullPath)) fm.remove(fullPath);
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
        if (regex.test(content) || regex.test(f.path)) results.push({ path: f.path, score: 1 });
      }
    }
    return { results };
  }

  async testAiConnection(payload) {
    const { target } = payload;
    let apiKey = this.config.aiApiKey || this.config.geminiApiKey;
    let model = this.config.aiModel;
    let provider = this.config.aiProvider || "google";

    if (target === "planner") {
      apiKey = this.config.plannerApiKey || apiKey;
      model = this.config.plannerModel || model;
      provider = this.config.plannerProvider || provider;
    } else if (target === "utility") {
      apiKey = this.config.utilityApiKey || apiKey;
      model = this.config.utilityModel || model;
      provider = this.config.utilityProvider || provider;
    }

    try {
      const res = await this.universalAiRequest({
        provider,
        model,
        messages: [{ role: "user", content: "Respond with exactly 'PONG'" }],
        apiKey
      });
      return { success: true, message: res.response };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  async universalAiRequest(payload) {
    const { provider, model, messages, system_prompt, apiKey: overrideKey } = payload;
    let apiKey = overrideKey || this.config.aiApiKey || this.config.geminiApiKey;
    
    // Check planner/utility tiers if needed
    if (!apiKey) apiKey = this.config.plannerApiKey || this.config.utilityApiKey;
    if (!apiKey) throw new Error("AI API Key missing in config");
    
    let url = provider === "google" ? `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-2.0-flash"}:generateContent?key=${apiKey}` : (provider === "openai" ? "https://api.openai.com/v1/chat/completions" : (provider === "groq" ? "https://api.groq.com/openai/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions"));
    let headers = { "Content-Type": "application/json" };
    if (provider !== "google") headers["Authorization"] = `Bearer ${apiKey}`;
    
    let body = provider === "google" ? { contents: [{ role: "user", parts: [{ text: system_prompt || "" }] }, ...messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }))] } : { model, messages: [{ role: "system", content: system_prompt || "" }, ...messages] };
    const req = new Request(url);
    req.method = "POST";
    req.headers = headers;
    req.body = JSON.stringify(body);
    const res = await req.loadJSON();
    
    if (res.error) throw new Error(res.error.message || JSON.stringify(res.error));
    
    let text = provider === "google" ? (res.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI") : (res.choices?.[0]?.message?.content || "No response from AI");
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
        const { type, requestId, ...configOnly } = request;
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
