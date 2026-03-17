const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, 'apps/desktop/src/App.tsx');
let code = fs.readFileSync(mainPath, 'utf8');

if (!code.includes("import Coach from '@/routes/coach'")) {
    code = code.replace(
        "import AgentDetail from '@/routes/agent-detail'",
        "import AgentDetail from '@/routes/agent-detail'\nimport Coach from '@/routes/coach'"
    );

    code = code.replace(
        '<Route path="/agents/:id" element={<AgentDetail />} />',
        '<Route path="/agents/:id" element={<AgentDetail />} />\n          <Route path="/coach" element={<Coach />} />'
    );

    fs.writeFileSync(mainPath, code);
}
