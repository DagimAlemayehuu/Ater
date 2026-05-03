import os

path = '/Users/dabodestroyer/code/Antigravity/LifeOs/apps/desktop/src/routes/academic.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

# We need to find the handleSetCurrentSemester end again.
start_idx = -1
for i, line in enumerate(lines):
    if "const handleSetCurrentSemester = async" in line:
        for j in range(i, len(lines)):
            if lines[j].strip() == "}":
                start_idx = j + 1
                break
        break

# Now we need to find where handleNavigate properly continues.
# Looking at the previous view:
# 479:             const res = await sidecarApi.findVaultPage(pageName)

end_idx = -1
for i in range(start_idx, len(lines)):
    if "const res = await sidecarApi.findVaultPage(pageName)" in lines[i]:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_content = """
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
        try {
"""
    lines[start_idx:end_idx] = [new_content]
    with open(path, 'w') as f:
        f.writelines(lines)
    print("Fixed.")
else:
    print(f"Indices not found: start={start_idx}, end={end_idx}")
