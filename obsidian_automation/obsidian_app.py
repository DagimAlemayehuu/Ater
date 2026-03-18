#!/usr/bin/env python3
import customtkinter as ctk
import sys
import threading
import queue
import re
import os
from pathlib import Path

# --- PATH SETUP ---
# This block handles imports when running as a script vs frozen app
if __name__ == "__main__":
    if not getattr(sys, 'frozen', False):
        # Standard script mode
        current_dir = Path(__file__).parent.resolve()
        scripts_dir = current_dir.parent.resolve()
        if str(scripts_dir) not in sys.path:
            sys.path.insert(0, str(scripts_dir))
    
    # Imports (PyInstaller will bundle these automatically)
    import obsidian_automation.vault_utils as vault_utils
    import obsidian_automation.Deployer as Deployer
    import obsidian_automation.Validator as Validator
    import obsidian_automation.Indexer as Indexer
    import obsidian_automation.clean as clean
    import obsidian_automation.unit_combinor as unit_combinor

# --- THEME CONFIG ---
ctk.set_appearance_mode("System")
ctk.set_default_color_theme("dark-blue")

# --- COLOR PALETTE ---
C_BG_MAIN    = ("#ffffff", "#1e1e1e")
C_BG_SIDEBAR = ("#f2f2f2", "#202020")
C_CONSOLE    = ("#f8f8f8", "#161616")
C_BORDER     = ("#e0e0e0", "#333333")
C_TEXT_MAIN  = ("#1a1a1a", "#dcddde")
C_TEXT_DIM   = ("#666666", "#999999")

C_BTN_FG     = ("#e0e0e0", "#2b2b2b")
C_BTN_HOVER  = ("#d0d0d0", "#404040")

C_ACCENT_BG    = ("#404040", "#4a4a4a")       
C_ACCENT_HOVER = ("#202020", "#606060")
C_ACCENT_TEXT  = ("#ffffff", "#ffffff") 

C_LOG_ERROR   = "#d32f2f"   
C_LOG_SUCCESS = "#388e3c"   
C_LOG_WARNING = "#f57c00"   
C_LOG_INPUT   = "#61afef"   
C_LOG_HEAD_LIGHT = "#1a1a1a"
C_LOG_HEAD_DARK  = "#aaaaaa"

class GUIInputAdapter:
    def __init__(self, app_ref):
        self.input_queue = queue.Queue()
        self.app_ref = app_ref

    def readline(self):
        return self.input_queue.get()
    
    def read(self, size=-1):
        return self.input_queue.get()

    def write_to_script(self, text):
        self.input_queue.put(text + "\n")

class NeatRedirector:
    def __init__(self, text_widget):
        self.text_widget = text_widget
        mode = ctk.get_appearance_mode()
        head_col = C_LOG_HEAD_DARK if mode == "Dark" else C_LOG_HEAD_LIGHT

        self.text_widget._textbox.tag_config("error", foreground=C_LOG_ERROR)
        self.text_widget._textbox.tag_config("success", foreground=C_LOG_SUCCESS)
        self.text_widget._textbox.tag_config("warning", foreground=C_LOG_WARNING)
        self.text_widget._textbox.tag_config("heading", foreground=head_col, font=("Inter", 12, "bold"))
        self.text_widget._textbox.tag_config("user_input", foreground=C_LOG_INPUT, font=("Consolas", 12, "bold"))
        self.text_widget._textbox.tag_config("normal", foreground="")

    def write(self, text):
        try: self.text_widget.after(0, self._process_text, text)
        except: pass

    def _process_text(self, text):
        self.text_widget.configure(state="normal")
        lines = text.split('\n')
        if text == "\n":
             self.text_widget.insert("end", "\n", "normal")
             return

        for line in lines:
            if not line: continue
            clean_line = re.sub(r'[^\x00-\x7F]+', '', line).strip()
            if not clean_line and line.strip() == "": continue 
            if clean_line.startswith("!!"): continue

            tag = "normal"
            lower_line = clean_line.lower()

            if "error" in lower_line or "fail" in lower_line or "traceback" in lower_line:
                tag = "error"
            elif "success" in lower_line or "valid" in lower_line or "generated" in lower_line or "fixed" in lower_line:
                tag = "success"
            elif "warning" in lower_line or "orphan" in lower_line:
                tag = "warning"
            elif clean_line.startswith("===") or clean_line.startswith("---") or clean_line.startswith(">>>"):
                clean_line = clean_line.replace("=", "").replace("-", "").replace(">", "").strip().upper()
                self.text_widget.insert("end", clean_line + "\n", "heading")
                continue
            
            if clean_line.startswith("> "):
                tag = "user_input"

            self.text_widget.insert("end", clean_line + "\n", tag)

        self.text_widget.see("end")
        self.text_widget.configure(state="disabled")

    def flush(self): pass

class ObsidianApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Obsidian Automation")
        w, h = 1100, 750
        ws = self.winfo_screenwidth()
        hs = self.winfo_screenheight()
        x = (ws/2) - (w/2)
        y = (hs/2) - (h/2)
        self.geometry('%dx%d+%d+%d' % (w, h, x, y))
        
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self.input_adapter = GUIInputAdapter(self)
        sys.stdin = self.input_adapter
        
        # --- CRITICAL FIX FOR PYINSTALLER PATHS ---
        if getattr(sys, 'frozen', False):
            # If running as a compiled .app, look in the same folder as the executable
            # (Inside Obsidian Automation.app/Contents/MacOS/)
            base_path = Path(sys.executable).parent
        else:
            # If running as a script, look in the script folder
            base_path = Path(__file__).parent.resolve()
            
        self.batch_file_path = base_path / "ai_batch_input.md"
        # ------------------------------------------

        # --- SIDEBAR ---
        self.sidebar = ctk.CTkFrame(self, width=240, corner_radius=0, fg_color=C_BG_SIDEBAR)
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        self.sidebar.grid_rowconfigure(10, weight=1) 

        self.logo = ctk.CTkLabel(self.sidebar, text="AUTOMATION", font=("Inter", 14, "bold"), text_color=C_TEXT_DIM)
        self.logo.grid(row=0, column=0, padx=25, pady=(30, 20), sticky="w")

        self.create_btn("Deploy Notes", self.run_deploy, 1)
        self.create_btn("Validate Vault", self.run_validate, 2)
        self.create_btn("Index & MOCs", self.run_index, 3)
        self.create_btn("Clean Links", self.run_clean, 4)
        self.create_btn("Combine Units", self.run_combine, 5)

        self.sep = ctk.CTkFrame(self.sidebar, height=1, fg_color=C_BORDER)
        self.sep.grid(row=6, column=0, sticky="ew", padx=20, pady=20)

        self.sync_btn = ctk.CTkButton(
            self.sidebar, text="FULL SYNC", command=self.run_full_sync,
            fg_color=C_ACCENT_BG, hover_color=C_ACCENT_HOVER, text_color=C_ACCENT_TEXT,
            height=45, corner_radius=6, font=("Inter", 12, "bold")
        )
        self.sync_btn.grid(row=7, column=0, padx=20, pady=0, sticky="ew")

        self.view_toggle = ctk.CTkSegmentedButton(
            self.sidebar, values=["Output Log", "AI Input"],
            command=self.toggle_view,
            selected_color=C_ACCENT_BG, 
            unselected_color=C_BTN_FG,
            selected_hover_color=C_ACCENT_HOVER,
            text_color=C_TEXT_MAIN
        )
        self.view_toggle.set("Output Log")
        self.view_toggle.grid(row=11, column=0, padx=20, pady=25, sticky="ew")

        # --- MAIN AREA ---
        self.main_area = ctk.CTkFrame(self, fg_color=C_BG_MAIN, corner_radius=0)
        self.main_area.grid(row=0, column=1, sticky="nsew")
        self.main_area.grid_rowconfigure(0, weight=1)
        self.main_area.grid_columnconfigure(0, weight=1)

        self.view_console = ctk.CTkFrame(self.main_area, fg_color="transparent")
        self.view_console.grid(row=0, column=0, sticky="nsew", padx=20, pady=20)
        self.view_console.grid_rowconfigure(1, weight=1)
        self.view_console.grid_columnconfigure(0, weight=1)

        self.progress = ctk.CTkProgressBar(self.view_console, height=2, progress_color=C_TEXT_MAIN)
        self.progress.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        self.progress.set(0)

        self.console_log = ctk.CTkTextbox(
            self.view_console, font=("Consolas", 13), 
            text_color=C_TEXT_MAIN, fg_color=C_CONSOLE,
            border_width=1, border_color=C_BORDER, corner_radius=4
        )
        self.console_log.grid(row=1, column=0, sticky="nsew")
        self.console_log.configure(state="disabled")

        self.cmd_frame = ctk.CTkFrame(self.view_console, height=45, fg_color="transparent")
        self.cmd_frame.grid(row=2, column=0, sticky="ew", pady=(10, 0))
        
        self.cmd_entry = ctk.CTkEntry(
            self.cmd_frame, placeholder_text="Type command here (e.g. '1, 3' or 'yes')...",
            font=("Inter", 12), fg_color=C_CONSOLE, border_width=1, border_color=C_BORDER, 
            corner_radius=4, height=40, text_color=C_TEXT_MAIN
        )
        self.cmd_entry.pack(side="left", fill="x", expand=True)
        self.cmd_entry.bind("<Return>", self.send_command)
        
        self.send_btn = ctk.CTkButton(
            self.cmd_frame, text="Send", width=80, command=self.send_command,
            fg_color=C_BTN_FG, hover_color=C_BTN_HOVER, text_color=C_TEXT_MAIN, height=40
        )
        self.send_btn.pack(side="right", padx=(10, 0))

        self.view_editor = ctk.CTkFrame(self.main_area, fg_color="transparent")
        
        self.editor_toolbar = ctk.CTkFrame(self.view_editor, fg_color="transparent")
        self.editor_toolbar.pack(fill="x", pady=(0, 10))
        
        self.btn_save = ctk.CTkButton(
            self.editor_toolbar, text="Save Input", width=100, command=self.save_input, 
            fg_color=C_ACCENT_BG, hover_color=C_ACCENT_HOVER, text_color=C_ACCENT_TEXT
        )
        self.btn_save.pack(side="right")
        
        self.btn_paste = ctk.CTkButton(
            self.editor_toolbar, text="Paste", width=80, command=self.paste_clip, 
            fg_color=C_BTN_FG, hover_color=C_BTN_HOVER, text_color=C_TEXT_MAIN
        )
        self.btn_paste.pack(side="right", padx=10)

        self.input_text = ctk.CTkTextbox(
            self.view_editor, font=("Consolas", 13), 
            text_color=C_TEXT_MAIN, fg_color=C_CONSOLE,
            border_width=1, border_color=C_BORDER, corner_radius=4
        )
        self.input_text.pack(fill="both", expand=True)
        self.load_input_file()

        self.redirector = NeatRedirector(self.console_log)
        sys.stdout = self.redirector
        sys.stderr = self.redirector

    def create_btn(self, text, cmd, row):
        btn = ctk.CTkButton(
            self.sidebar, text=text, command=cmd,
            fg_color="transparent", text_color=C_TEXT_MAIN, anchor="w",
            hover_color=C_BTN_HOVER, height=40, font=("Inter", 13),
            corner_radius=4
        )
        btn.grid(row=row, column=0, padx=15, pady=3, sticky="ew")

    def toggle_view(self, value):
        if value == "Output Log":
            self.view_editor.pack_forget() 
            self.view_editor.grid_forget()
            self.view_console.grid(row=0, column=0, sticky="nsew", padx=20, pady=20)
        else:
            self.view_console.grid_forget()
            self.view_editor.grid(row=0, column=0, sticky="nsew", padx=20, pady=20)

    def send_command(self, event=None):
        text = self.cmd_entry.get()
        if text:
            print(f"> {text}")
            self.input_adapter.write_to_script(text)
            self.cmd_entry.delete(0, "end")

    def paste_clip(self):
        try:
            self.input_text.delete("0.0", "end")
            self.input_text.insert("0.0", self.clipboard_get())
        except: pass

    def load_input_file(self):
        try:
            if self.batch_file_path.exists(): 
                self.input_text.insert("0.0", vault_utils.read_file(self.batch_file_path))
        except: pass

    def save_input(self):
        content = self.input_text.get("0.0", "end").strip()
        if content:
            try:
                # Ensure the directory exists (important inside app bundle)
                self.batch_file_path.parent.mkdir(parents=True, exist_ok=True)
                with open(self.batch_file_path, "w", encoding="utf-8") as f: f.write(content)
                print(f"Input saved.")
                self.view_toggle.set("Output Log")
                self.toggle_view("Output Log")
            except Exception as e:
                print(f"Error saving file: {e}")

    def start_task(self, func):
        self.view_toggle.set("Output Log")
        self.toggle_view("Output Log")
        self.console_log.configure(state="normal")
        self.console_log.delete("1.0", "end")
        self.console_log.configure(state="disabled")
        self.progress.configure(mode="indeterminate")
        self.progress.start()
        self.sync_btn.configure(state="disabled")
        self.cmd_entry.focus_set()
        threading.Thread(target=lambda: self._wrapper(func)).start()

    def _wrapper(self, func):
        try: func()
        except Exception as e: print(f"System Error: {e}")
        finally: self.after(0, self._finish)

    def _finish(self):
        self.progress.stop()
        self.progress.set(1)
        self.sync_btn.configure(state="normal")
        self.after(1500, lambda: self.progress.set(0))

    def task_deploy(self):
        print("DEPLOYING NOTES")
        if not self.batch_file_path.exists(): 
            print("Error: ai_batch_input.md not found.")
            print("Action: Go to 'AI Input' tab, paste content, and click 'Save Input'.")
            return
        try:
            content = vault_utils.read_file(self.batch_file_path)
            if content.strip().startswith("```markdown"):
                content = content.replace("```markdown", "").replace("```", "").strip()
            
            note_pattern = re.compile(r"--- START_NOTE ---\s*\n(.*?)\n\s*--- END_NOTE ---", re.DOTALL)
            notes = note_pattern.findall(content)
            cleaned = "\n".join([f"--- START_NOTE ---\n{n.strip()}\n--- END_NOTE ---" for n in notes]) if notes else content

            snap = vault_utils.load_all_notes_metadata(vault_utils.VAULT_BASE_PATH)
            Deployer.deploy_notes_from_text(cleaned, snap)
        except Exception as e: print(f"Error: {e}")

    def task_validate(self):
        print("VALIDATING VAULT")
        Validator.main()

    def task_index(self):
        print("INDEXING & MOCs")
        Indexer.main()

    def task_clean(self):
        print("CLEANING LINKS")
        print("If asked 'yes/no', type it below and hit Enter.")
        clean.main()
    
    def task_combine(self):
        print("UNIT COMBINER")
        print("Enter unit numbers below (e.g. '1, 3') when prompted.")
        unit_combinor.main()

    def task_full_sync(self):
        print("FULL SYNC STARTED")
        self.task_deploy()
        print("")
        self.task_validate()
        print("")
        self.task_index()
        print("")
        print("SYNC COMPLETE")

    def run_deploy(self): self.start_task(self.task_deploy)
    def run_validate(self): self.start_task(self.task_validate)
    def run_index(self): self.start_task(self.task_index)
    def run_clean(self): self.start_task(self.task_clean)
    def run_combine(self): self.start_task(self.task_combine)
    def run_full_sync(self): self.start_task(self.task_full_sync)

if __name__ == "__main__":
    app = ObsidianApp()
    app.mainloop()