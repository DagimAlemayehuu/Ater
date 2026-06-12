export interface SandboxSrcDocOptions {
  artifactId?: string
  version?: number
  theme?: 'dark' | 'light'
}

function getThemeCss(theme?: 'dark' | 'light') {
  if (theme === 'light') {
    return `
:root {
  --background: 0 0% 98%;
  --foreground: 0 0% 15%;
  --muted: 0 0% 92%;
  --muted-foreground: 0 0% 45%;
  --border: 0 0% 85%;
  --primary: 0 0% 25%;
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

  return `
:root {
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

export function buildSandboxSrcDoc(code: string, options: SandboxSrcDocOptions = {}): string {
  const artifactId = JSON.stringify(options.artifactId || '')
  const version = options.version || 1
  const theme = options.theme || 'dark'
  const htmlClass = theme === 'dark' ? 'class="dark"' : 'class="light"'
  const themeCss = getThemeCss(theme)

  return `<!doctype html>
<html ${htmlClass}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com" crossorigin="anonymous"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
    <style>${themeCss}</style>
    <script>
      window.__ATER_ARTIFACT__ = {"artifactId":${artifactId},"version":${version}};
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
    ${code}
  </body>
</html>`
}
