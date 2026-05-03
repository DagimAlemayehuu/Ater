import re

with open('apps/desktop/src/routes/practice.tsx', 'r') as f:
    content = f.read()

# 1. Add import
if "import { MarkdownBlock }" not in content:
    content = content.replace(
        "import {AdvancedPracticeConfig, Question} from '@/types/practice'",
        "import {AdvancedPracticeConfig, Question} from '@/types/practice'\nimport { MarkdownBlock } from '@/components/MiniPracticeUI'"
    )

# 2. Question Title
content = content.replace(
    '<h2 className="text-2xl font-black tracking-tight leading-tight">{currentQuestion.question}</h2>',
    '<div className="text-2xl font-black tracking-tight leading-tight"><MarkdownBlock content={currentQuestion.question} /></div>'
)

# 3. MCQ options
content = content.replace(
    '<span className="mr-4 text-muted-foreground/20">{key}</span> {String(val)}',
    '<span className="text-muted-foreground/20 shrink-0 mt-0.5 mr-4">{key}</span> <div className="flex-1 overflow-x-auto"><MarkdownBlock content={String(val)} /></div>'
)

# 4. Debug content
content = content.replace(
    '<pre className="p-6 bg-muted/10 rounded-md text-xs font-mono text-foreground/60 overflow-x-auto"><code>{currentQuestion.content}</code></pre>',
    '<div className="p-6 bg-muted/10 rounded-md text-xs font-mono text-foreground/60 overflow-x-auto"><MarkdownBlock content={`\\`\\`\\`${currentQuestion.language || \'text\'}\\n${currentQuestion.content}\\n\\`\\`\\``} /></div>'
)

# 5. Answer reveal
content = content.replace(
    '{isRevealed && <div className="p-6 bg-muted/5 border-l border-primary rounded-r-md text-sm font-medium text-foreground/60 whitespace-pre-wrap">{String(currentQuestion.answer)}</div>}',
    '{isRevealed && <div className="p-6 bg-muted/5 border-l border-primary rounded-r-md text-sm font-medium text-foreground/60 whitespace-pre-wrap"><MarkdownBlock content={String(currentQuestion.answer)} /></div>}'
)

# 6. Fill in wrapper
content = content.replace(
    '<div className="p-8 bg-muted/5 border border-border/10 rounded-lg text-lg font-medium leading-relaxed">',
    '<div className="p-8 bg-muted/5 border border-border/10 rounded-lg text-lg font-medium leading-relaxed flex flex-wrap items-center gap-y-4">'
)
content = content.replace(
    '<React.Fragment key={i}>\n {part}',
    '<React.Fragment key={i}>\n <MarkdownBlock content={part} />'
)
content = content.replace(
    'mx-2 border-b-2 bg-transparent outline-none w-32 text-center text-sm font-black uppercase"',
    'mx-2 border-b-2 bg-transparent outline-none w-32 text-center text-sm font-black uppercase shrink-0 self-center"'
)

# 7. Explanation
content = content.replace(
    '{isRevealed && currentQuestion.explanation && <div className="p-6 bg-muted/5 border border-border/10 rounded-md text-xs font-medium text-muted-foreground italic leading-relaxed">{currentQuestion.explanation}</div>}',
    '{isRevealed && currentQuestion.explanation && <div className="p-6 bg-muted/5 border border-border/10 rounded-md text-xs font-medium text-muted-foreground italic leading-relaxed"><MarkdownBlock content={currentQuestion.explanation} /></div>}'
)

with open('apps/desktop/src/routes/practice.tsx', 'w') as f:
    f.write(content)

print("Patched successfully")
