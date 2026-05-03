import re

with open('apps/desktop/src/routes/agents.tsx', 'r') as f:
    content = f.read()

# Remove lucide-react icon usages entirely from the UI
replacements = [
    (r'<ChevronLeft size=\{16\} />', 'BACK'),
    (r'<Zap size=\{12\} /> ', ''),
    (r'<ChevronRight size=\{12\} /> ', ''),
    (r'<ShieldCheck size=\{12\} /> ', ''),
    (r'<RefreshCw size=\{12\} /> ', ''),
    (r'<RefreshCw className="animate-spin mr-2" size=\{11\} /> ', ''),
    (r'<Zap className="mr-2" size=\{11\} /> ', ''),
    (r'<ShieldCheck className="mr-2" size=\{11\} /> ', ''),
    (r'<RefreshCw size=\{32\} className="animate-spin text-foreground/20 mb-6" />', '<div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin mb-6" />'),
    (r'<RefreshCw size=\{24\} className="animate-spin text-muted-foreground" />', '<div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />'),
    (r'<Sparkles size=\{20\} className="text-foreground/40" />', ''),
    (r'<Layers size=\{20\} className="text-foreground/40" />', ''),
    (r'<ShieldCheck size=\{32\} />', ''),
    (r'<FileText size=\{14\} />', ''),
    (r'<X size=\{14\} />', ''),
    (r'<ChevronLeft size=\{16\} className="text-muted-foreground" />', 'BACK')
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open('apps/desktop/src/routes/agents.tsx', 'w') as f:
    f.write(content)

