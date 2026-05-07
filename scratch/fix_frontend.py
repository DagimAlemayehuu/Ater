import re

practice_file = "apps/desktop/src/routes/practice.tsx"
with open(practice_file, "r") as f:
    content = f.read()

# Fix 1: Add all question types to the UI config
OLD_TYPES = """ {[
 {key: 'mcq', label: 'Choice'}, 
 {key: 'true_false', label: 'T/F'}, 
 {key: 'writing', label: 'Write'}, 
 {key: 'fill_in', label: 'Fill'}
 ].map(type => ("""

NEW_TYPES = """ {[
 {key: 'mcq', label: 'Choice'}, 
 {key: 'true_false', label: 'T/F'}, 
 {key: 'writing', label: 'Write'}, 
 {key: 'fill_in', label: 'Fill'},
 {key: 'debug', label: 'Debug'},
 {key: 'trace', label: 'Trace'},
 {key: 'order', label: 'Order'},
 {key: 'matching', label: 'Match'},
 {key: 'synthesis', label: 'Synth'}
 ].map(type => ("""

content = content.replace(OLD_TYPES, NEW_TYPES)

# Fix 2: Change MCQ rendering to highlight correct answer and NOT wrong answer
content = re.sub(
    r'className=\{cn\("p-5 border border-border/10 rounded-md text-left transition-all text-\[13px\] font-black uppercase tracking-tight", isCorrect \? "bg-primary/5 border-primary" : isWrong \? "bg-destructive/5 border-destructive" : isSelected && !isRevealed \? "bg-muted/30 border-foreground" : "hover:bg-muted/10"\)\}',
    'className={cn("p-5 border rounded-md text-left transition-all text-[13px] font-black uppercase tracking-tight", isCorrect ? "bg-primary/10 border-primary text-primary" : isRevealed ? "border-border/10 opacity-40 grayscale" : isSelected ? "bg-muted/30 border-foreground" : "border-border/10 hover:bg-muted/10")}',
    content
)

# Fix 3: Change True/False rendering
content = re.sub(
    r'className=\{cn\("h-32 border border-border/10 rounded-md text-\[10px\] font-black uppercase tracking-widest transition-all", isCorrect \? "bg-primary/10 border-primary text-primary" : isWrong \? "bg-destructive/10 border-destructive text-destructive" : isSelected && !isRevealed \? "bg-muted/30 border-foreground" : "hover:bg-muted/10 text-muted-foreground/40"\)\}',
    'className={cn("h-32 border rounded-md text-[10px] font-black uppercase tracking-widest transition-all", isCorrect ? "bg-primary/10 border-primary text-primary" : isRevealed ? "border-border/10 opacity-40 grayscale text-muted-foreground/40" : isSelected ? "bg-muted/30 border-foreground" : "border-border/10 hover:bg-muted/10 text-muted-foreground/40")}',
    content
)

with open(practice_file, "w") as f:
    f.write(content)
print("Updated practice.tsx")

types_file = "apps/desktop/src/types/practice.ts"
with open(types_file, "r") as f:
    tcontent = f.read()

if "trace: number" not in tcontent:
    tcontent = re.sub(
        r'debug: number;\n  synthesis: number;',
        'debug: number;\n  synthesis: number;\n  trace: number;',
        tcontent
    )
if '"trace"' not in tcontent:
    tcontent = re.sub(
        r'\| "synthesis"',
        '| "synthesis"\n  | "trace"',
        tcontent
    )

with open(types_file, "w") as f:
    f.write(tcontent)

print("Updated practice.ts")
