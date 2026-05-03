import os

path = '/Users/dabodestroyer/code/Antigravity/LifeOs/apps/desktop/src/routes/academic.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

# Find the spot after handleSetCurrentSemester (line 427 in previous view)
# We want to insert after the closing brace of that function.

new_functions = """
    const handleScaffoldProgram = async (name: string, targetYears: number, level: string, currentYearIdx: number) => {
        try {
            setLoading(true)
            const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
            for (let i = 0; i < targetYears; i++) {
                const yearTitle = `Year ${romanNumerals[i] || (i + 1)}`;
                
                let status = "[[Planned]]";
                if (i < currentYearIdx) status = "[[Completed]]";
                else if (i === currentYearIdx) status = "[[Active]]";

                await sidecarApi.createVaultRow("09 - Years", yearTitle, {
                    Program: `[[${name}]]`,
                    "Academic Level": `[[${level}]]`,
                    Status: status,
                    "Current Year": i === currentYearIdx,
                    "Target Years": targetYears,
                    "Target Credits": 0,
                    "Earned Credits": 0,
                    "Cumulative GPA": 0.00
                });
            }
            toast.success(`Scaffolded ${name}`);
            fetchData();
        } catch (err) {
            toast.error("Scaffolding failed");
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProgram = async (oldName: string, newMetadata: { name: string, level: string, targetYears: number }) => {
        try {
            setLoading(true)
            const yearsToUpdate = data?.years.filter(y => (y.properties?.Program || y.properties?.program) === oldName) || [];
            for (const y of yearsToUpdate) {
                await sidecarApi.updateVaultRow("09 - Years", y.id, {
                    Program: `[[${newMetadata.name}]]`,
                    "Academic Level": `[[${newMetadata.level}]]`,
                    "Target Years": newMetadata.targetYears
                });
            }
            toast.success(`Updated program ${newMetadata.name}`);
            fetchData();
        } catch (err) {
            toast.error("Failed to update program");
        } finally {
            setLoading(false)
        }
    }

    const handleNavigate = async (pageName: string) => {
"""

# We look for the start of the broken part.
# The previous view showed:
# 427:     }
# 428: 
# 429: 
# 430: 
# 431:         try {

for i, line in enumerate(lines):
    if "const handleSetCurrentSemester = async" in line:
        # Found the start of the previous function. Now find its end.
        for j in range(i, len(lines)):
            if lines[j].strip() == "}":
                # Found the end of handleSetCurrentSemester.
                # Now insert the functions.
                # But wait, we also need to make sure we don't duplicate if they are already there.
                # Actually, I'll just replace the whole range [j+1 : j+5] (the empty lines and broken start)
                lines[j+1:j+5] = [new_functions]
                break
        break

with open(path, 'w') as f:
    f.writelines(lines)
