import re

file_path = "apps/desktop/src/routes/practice.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add trace to the array of supported types
content = re.sub(
    r"\['mcq', 'true_false', 'writing', 'fill_in', 'matching', 'order', 'debug', 'synthesis'\]\.includes\(k\)",
    r"['mcq', 'true_false', 'writing', 'fill_in', 'matching', 'order', 'debug', 'synthesis', 'trace'].includes(k)",
    content
)

# Combine trace with writing/synthesis/debug
content = re.sub(
    r"\(currentQuestion\.type === 'writing' \|\| currentQuestion\.type === 'synthesis' \|\| currentQuestion\.type === 'debug'\)",
    r"(currentQuestion.type === 'writing' || currentQuestion.type === 'synthesis' || currentQuestion.type === 'debug' || currentQuestion.type === 'trace')",
    content
)

# Update self-grading check condition
content = re.sub(
    r"\['writing', 'synthesis', 'debug'\]\.includes\(currentQuestion\.type\)",
    r"['writing', 'synthesis', 'debug', 'trace'].includes(currentQuestion.type)",
    content
)

# Insert minimal order and matching renderers if they don't exist
ORDER_MATCHING_UI = """
 {currentQuestion.type === 'order' && (
 <div className="space-y-2">
 {(userAnswers[currentQuestion.id] || currentQuestion.steps || []).map((step: string, i: number) => {
    const list = userAnswers[currentQuestion.id] || currentQuestion.steps || [];
    const moveUp = () => { if(i>0) { const n = [...list]; [n[i-1], n[i]] = [n[i], n[i-1]]; handleSelectAnswer(n); } };
    const moveDown = () => { if(i<list.length-1) { const n = [...list]; [n[i], n[i+1]] = [n[i+1], n[i]]; handleSelectAnswer(n); } };
    const isCorrect = isRevealed && step === (currentQuestion.answer || [])[i];
    const isWrong = isRevealed && step !== (currentQuestion.answer || [])[i];
    return (
        <div key={i} className={`flex items-center gap-2 p-3 border rounded-md ${isCorrect ? 'border-primary bg-primary/10' : isWrong ? 'border-destructive bg-destructive/10' : 'border-border/10'}`}>
            <div className="flex flex-col">
                <button disabled={isRevealed || i===0} onClick={moveUp} className="text-xs px-2 opacity-50 hover:opacity-100">▲</button>
                <button disabled={isRevealed || i===list.length-1} onClick={moveDown} className="text-xs px-2 opacity-50 hover:opacity-100">▼</button>
            </div>
            <div className="text-sm font-medium">{step}</div>
        </div>
    )
 })}
 </div>
 )}

 {currentQuestion.type === 'matching' && currentQuestion.pairs && (
 <div className="space-y-4">
 {currentQuestion.pairs.map((pair: any, i: number) => {
    const rights = currentQuestion.pairs.map((p: any) => p.right).sort();
    const selected = (userAnswers[currentQuestion.id] || {})[pair.left] || "";
    const isCorrect = isRevealed && selected === pair.right;
    const isWrong = isRevealed && selected !== pair.right;
    return (
        <div key={i} className={`flex items-center gap-4 p-3 border rounded-md ${isCorrect ? 'border-primary bg-primary/10' : isWrong ? 'border-destructive bg-destructive/10' : 'border-border/10'}`}>
            <div className="flex-1 font-medium text-sm">{pair.left}</div>
            <div className="flex-1">
                <select disabled={isRevealed} value={selected} onChange={(e) => handleSelectAnswer({...userAnswers[currentQuestion.id], [pair.left]: e.target.value})} className="w-full p-2 bg-background border rounded outline-none">
                    <option value="">Select match...</option>
                    {rights.map((r: string, j: number) => <option key={j} value={r}>{r}</option>)}
                </select>
            </div>
            {isRevealed && isWrong && <div className="text-xs text-primary font-bold">{pair.right}</div>}
        </div>
    )
 })}
 </div>
 )}
"""

if "currentQuestion.type === 'order'" not in content:
    # Insert right before fill_in
    content = content.replace("{currentQuestion.type === 'fill_in' && (", ORDER_MATCHING_UI + "\n {currentQuestion.type === 'fill_in' && (")

with open(file_path, "w") as f:
    f.write(content)

print("Patched practice.tsx")
