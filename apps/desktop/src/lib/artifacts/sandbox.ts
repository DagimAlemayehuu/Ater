export interface SandboxSrcDocOptions {
  artifactId?: string
  version?: number
  theme?: 'dark' | 'light'
  state?: any
}

function getThemeCss() {
  return `
:root {
  --background: 0 0% 98%;
  --foreground: 0 0% 15%;
  --muted: 0 0% 92%;
  --muted-foreground: 0 0% 45%;
  --border: 0 0% 85%;
  --primary: 0 0% 25%;
}
html.dark {
  --background: 240 10% 4%;
  --foreground: 0 0% 96%;
  --muted: 240 4% 16%;
  --muted-foreground: 240 5% 65%;
  --border: 240 5% 18%;
  --primary: 0 0% 92%;
}
html, body {
  margin: 0;
  min-height: 100%;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: "Outfit", ui-sans-serif, system-ui, sans-serif;
}
body {
  padding: 16px;
}
* {
  box-sizing: border-box;
}
`
}

function isDoWhileKeyword(js: string, whileIdx: number): boolean {
  let idx = whileIdx - 1;
  while (idx >= 0 && /\s/.test(js[idx])) {
    idx--;
  }
  if (idx < 0) return false;

  // Case A: do { ... } while (cond);
  if (js[idx] === '}') {
    let depth = 1;
    idx--;
    while (idx >= 0 && depth > 0) {
      if (js[idx] === '}') depth++;
      else if (js[idx] === '{') depth--;
      idx--;
    }
    if (depth === 0) {
      // Find non-whitespace word before '{'
      while (idx >= 0 && /\s/.test(js[idx])) {
        idx--;
      }
      if (idx >= 1 && js.substring(idx - 1, idx + 1) === 'do' && !/[a-zA-Z0-9_$]/.test(js[idx - 2] || '') && !/[a-zA-Z0-9_$]/.test(js[idx + 1] || '')) {
        return true;
      }
    }
    return false;
  }

  // Case B: do statement; while (cond);
  let semisCount = 0;
  while (idx >= 0) {
    if (js[idx] === '{' || js[idx] === '}') {
      return false;
    }
    if (js[idx] === ';') {
      semisCount++;
      if (semisCount > 1) {
        return false;
      }
    }
    if (js.substring(idx, idx + 2) === 'do' && !/[a-zA-Z0-9_$]/.test(js[idx - 1] || '') && !/[a-zA-Z0-9_$]/.test(js[idx + 2] || '')) {
      return true;
    }
    idx--;
  }

  return false;
}

export function injectLoopGuardToJS(js: string): string {
  let output = '';
  let i = 0;
  let guardCount = 0;

  while (i < js.length) {
    const isDoKeyword = (
      js.substring(i, i + 2) === 'do' && !/[a-zA-Z0-9_$]/.test(js[i - 1] || '') && !/[a-zA-Z0-9_$]/.test(js[i + 2] || '')
    );
    const isForOrWhileKeyword = (
      (js.substring(i, i + 3) === 'for' && !/[a-zA-Z0-9_$]/.test(js[i - 1] || '') && !/[a-zA-Z0-9_$]/.test(js[i + 3] || '')) ||
      (js.substring(i, i + 5) === 'while' && !/[a-zA-Z0-9_$]/.test(js[i - 1] || '') && !/[a-zA-Z0-9_$]/.test(js[i + 5] || ''))
    );

    if (isDoKeyword) {
      const start = i;
      i += 2; // skip 'do'
      let temp = i;
      while (temp < js.length && /\s/.test(js[temp])) {
        temp++;
      }
      if (temp < js.length && js[temp] === '{') {
        i = temp + 1; // skip '{'
        guardCount++;
        const guardVar = `__guard_${guardCount}`;
        output += `let ${guardVar} = 0;\ndo {\n  if (++${guardVar} > 1000000) throw new Error("Infinite loop detected: exceeded 1,000,000 iterations");\n`;
      } else {
        // Single statement do loop without braces
        let stmtStart = temp;
        while (temp < js.length && js[temp] !== ';') {
          temp++;
        }
        if (temp < js.length && js[temp] === ';') {
          const stmt = js.substring(stmtStart, temp + 1);
          i = temp + 1; // skip ';'
          guardCount++;
          const guardVar = `__guard_${guardCount}`;
          output += `let ${guardVar} = 0;\ndo {\n  if (++${guardVar} > 1000000) throw new Error("Infinite loop detected: exceeded 1,000,000 iterations");\n  ${stmt}\n}`;
        } else {
          output += js.substring(start, i);
        }
      }
      continue;
    }

    if (isForOrWhileKeyword) {
      const keyword = js.substring(i, i + 3) === 'for' ? 'for' : 'while';
      const start = i;

      if (keyword === 'while' && isDoWhileKeyword(js, start)) {
        // Ending while of a do-while loop, skip injecting guard block!
        output += keyword;
        i += keyword.length;
        continue;
      }

      i += keyword.length;

      // Skip whitespace to opening parenthesis
      while (i < js.length && /\s/.test(js[i])) {
        i++;
      }

      if (i < js.length && js[i] === '(') {
        let parenDepth = 1;
        i++;
        while (i < js.length && parenDepth > 0) {
          if (js[i] === '(') parenDepth++;
          else if (js[i] === ')') parenDepth--;
          i++;
        }

        if (parenDepth === 0) {
          const header = js.substring(start, i);

          // Skip whitespace to check if next is '{'
          while (i < js.length && /\s/.test(js[i])) {
            i++;
          }

          if (i < js.length && js[i] === '{') {
            i++; // skip '{'
            guardCount++;
            const guardVar = `__guard_${guardCount}`;
            output += `let ${guardVar} = 0;\n${header} {\n  if (++${guardVar} > 1000000) throw new Error("Infinite loop detected: exceeded 1,000,000 iterations");\n`;
          } else {
            // Single statement loop without braces
            let stmtStart = i;
            while (i < js.length && js[i] !== ';') {
              i++;
            }
            if (i < js.length && js[i] === ';') {
              i++; // skip ';'
              const stmt = js.substring(stmtStart, i);
              guardCount++;
              const guardVar = `__guard_${guardCount}`;
              output += `let ${guardVar} = 0;\n${header} {\n  if (++${guardVar} > 1000000) throw new Error("Infinite loop detected: exceeded 1,000,000 iterations");\n  ${stmt}\n}`;
            } else {
              output += js.substring(start, i);
            }
          }
          continue;
        }
      }

      i = start + keyword.length;
      output += keyword;
    } else {
      output += js[i];
      i++;
    }
  }

  return output;
}

export function preprocessSandboxCode(code: string): string {
  try {
    return code.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (match, openTag, jsContent, closeTag) => {
      if (openTag.includes(' src=')) {
        return match;
      }
      return openTag + injectLoopGuardToJS(jsContent) + closeTag;
    });
  } catch (e) {
    console.error('Error pre-processing sandbox loop guards, fallback to original code:', e);
    return code;
  }
}

export function buildSandboxSrcDoc(code: string, options: SandboxSrcDocOptions = {}): string {
  const artifactId = JSON.stringify(options.artifactId || '')
  const version = options.version || 1
  const theme = options.theme || 'dark'
  const htmlClass = theme === 'dark' ? 'class="dark"' : 'class="light"'
  const themeCss = getThemeCss()
  const preprocessedCode = preprocessSandboxCode(code)

  return `<!doctype html>
<html ${htmlClass}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com" crossorigin="anonymous"></script>
    <script>
      tailwind.config = {
        darkMode: 'class'
      };
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
    <style>${themeCss}</style>
    <script>
      window.__ATER_ARTIFACT__ = {"artifactId":${artifactId},"version":${version},"state":${JSON.stringify(options.state || {})}};
      
      // Listen for instant theme changes
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'ater:set-theme') {
          var theme = event.data.theme;
          var html = document.documentElement;
          if (theme === 'dark') {
            html.classList.add('dark');
            html.classList.remove('light');
            html.setAttribute('class', 'dark');
          } else {
            html.classList.add('light');
            html.classList.remove('dark');
            html.setAttribute('class', 'light');
          }
        }
      });
      
      // Automatic State Watcher & Serializer
      function serializeState() {
        var state = {};
        var inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(function(input) {
          var key = input.name || input.id;
          if (key) {
            if (input.type === 'checkbox') {
              state[key] = input.checked;
            } else if (input.type === 'radio') {
              if (input.checked) state[key] = input.value;
            } else {
              state[key] = isNaN(Number(input.value)) ? input.value : Number(input.value);
            }
          }
        });
        return state;
      }

      document.addEventListener('input', function() {
        var state = serializeState();
        window.parent.postMessage({
          "type": "ater:sandbox-state-change",
          "artifactId": ${artifactId},
          "version": ${version},
          "state": state
        }, "*");
      });

      // Automatic State Restorer
      window.addEventListener('DOMContentLoaded', function() {
        var savedState = window.__ATER_ARTIFACT__.state || {};
        Object.keys(savedState).forEach(function(key) {
          var input = document.querySelector('[name="' + key + '"], #' + key);
          if (input) {
            if (input.type === 'checkbox') {
              input.checked = !!savedState[key];
            } else if (input.type === 'radio') {
              var radio = document.querySelector('input[type="radio"][name="' + key + '"][value="' + savedState[key] + '"]');
              if (radio) radio.checked = true;
            } else {
              input.value = savedState[key];
            }
            // Trigger events to update client code
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });

      window.onerror = function(message, source, lineno, colno, error) {
        window.parent.postMessage({
          "type": "ater:sandbox-error",
          "artifactId": ${artifactId},
          "version":${version},
          "message": String(message || ""),
          "source": source,
          "lineno": lineno,
          "colno": colno,
          "stack": error && error.stack ? String(error.stack) : ""
        }, "*");
      };
      window.onunhandledrejection = function(event) {
        var reason = event && event.reason;
        window.parent.postMessage({
          "type": "ater:sandbox-error",
          "artifactId": ${artifactId},
          "version":${version},
          "message": reason && reason.message ? String(reason.message) : String(reason || "Unhandled promise rejection"),
          "stack": reason && reason.stack ? String(reason.stack) : ""
        }, "*");
      };
    </script>
  </head>
  <body>
    ${preprocessedCode}
  </body>
</html>`
}
