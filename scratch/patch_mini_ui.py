import re

file_path = "apps/desktop/src/components/MiniPracticeUI.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Combine trace with writing/synthesis/debug
content = re.sub(
    r"\['debug', 'writing', 'scenario', 'code', 'synthesis'\]\.includes\(currentQ\.type\)",
    r"['debug', 'writing', 'scenario', 'code', 'synthesis', 'trace'].includes(currentQ.type)",
    content
)

content = re.sub(
    r"\['debug', 'code'\]\.includes\(currentQ\.type\)",
    r"['debug', 'code', 'trace'].includes(currentQ.type)",
    content
)

content = re.sub(
    r"\['fill_in', 'writing', 'scenario', 'code', 'debug', 'synthesis'\]\.includes\(currentQ\.type \|\| 'writing'\)",
    r"['fill_in', 'writing', 'scenario', 'code', 'debug', 'synthesis', 'trace'].includes(currentQ.type || 'writing')",
    content
)

# Insert order and matching renderers if they don't exist
ORDER_MATCHING_UI = """
              {currentQ.type === 'order' && (
              <div className="space-y-2">
              {(userAnswers[currentQ.id] || currentQ.steps || []).map((step: string, i: number) => {
                  const list = userAnswers[currentQ.id] || currentQ.steps || [];
                  const moveUp = () => { if(i>0) { const n = [...list]; [n[i-1], n[i]] = [n[i], n[i-1]]; handleSelectAnswer(n); } };
                  const moveDown = () => { if(i<list.length-1) { const n = [...list]; [n[i], n[i+1]] = [n[i+1], n[i]]; handleSelectAnswer(n); } };
                  const isCorrect = isRevealed && step === (currentQ.answer || [])[i];
                  return (
                      <div key={i} className={`flex items-center gap-2 p-3 border rounded-md ${isCorrect ? 'border-primary bg-primary/10' : 'border-border/40 hover:bg-muted/5'}`}>
                          <div className="flex flex-col">
                              <button disabled={isRevealed || i===0} onClick={moveUp} className="text-[10px] px-2 opacity-50 hover:opacity-100">▲</button>
                              <button disabled={isRevealed || i===list.length-1} onClick={moveDown} className="text-[10px] px-2 opacity-50 hover:opacity-100">▼</button>
                          </div>
                          <div className="text-xs font-semibold">{step}</div>
                      </div>
                  )
              })}
              </div>
              )}

              {currentQ.type === 'matching' && currentQ.pairs && (
              <div className="space-y-4">
              {currentQ.pairs.map((pair: any, i: number) => {
                  const rights = currentQ.pairs.map((p: any) => p.right).sort();
                  const selected = (userAnswers[currentQ.id] || {})[pair.left] || "";
                  const isCorrect = isRevealed && selected === pair.right;
                  return (
                      <div key={i} className={`flex items-center gap-4 p-3 border rounded-md ${isCorrect ? 'border-primary bg-primary/10' : 'border-border/40'}`}>
                          <div className="flex-1 font-semibold text-xs">{pair.left}</div>
                          <div className="flex-1">
                              <select disabled={isRevealed} value={selected} onChange={(e) => handleSelectAnswer({...userAnswers[currentQ.id], [pair.left]: e.target.value})} className="w-full p-2 bg-background border rounded outline-none text-xs">
                                  <option value="">Select match...</option>
                                  {rights.map((r: string, j: number) => <option key={j} value={r}>{r}</option>)}
                              </select>
                          </div>
                          {isRevealed && !isCorrect && <div className="text-xs text-primary font-bold">{pair.right}</div>}
                      </div>
                  )
              })}
              </div>
              )}
"""

if "currentQ.type === 'order'" not in content:
    # Insert right before fill_in
    content = content.replace("{currentQ.type === 'fill_in' && (", ORDER_MATCHING_UI + "\n              {currentQ.type === 'fill_in' && (")

with open(file_path, "w") as f:
    f.write(content)

print("Patched MiniPracticeUI.tsx")
