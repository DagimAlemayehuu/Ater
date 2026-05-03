import os

path = '/Users/dabodestroyer/code/Antigravity/LifeOs/apps/desktop/src/routes/academic.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const handleSetCurrentSemester = async" in line:
        # We need to find where handleScaffoldProgram starts
        for j in range(i, len(lines)):
            if "const handleScaffoldProgram = async" in lines[j]:
                # Found the gap.
                # Re-write handleSetCurrentSemester properly.
                corrected = """    const handleSetCurrentSemester = async (id: string) => {
        try {
            const semesters = data?.semesters || [];
            for (const s of semesters) {
                if (s.id === id) {
                    await sidecarApi.updateVaultRow("08 - Semesters", s.id, { "Status": "[[Active]]" });
                } else if (s["Status"] === "[[Active]]" || s["Status"] === "Active") {
                    await sidecarApi.updateVaultRow("08 - Semesters", s.id, { "Status": "[[Completed]]" });
                }
            }
            toast.success("Current Semester Set");
            fetchData();
        } catch(err) {
            toast.error("Failed to set semester");
        }
    }

"""
                lines[i:j] = [corrected]
                break
        break

with open(path, 'w') as f:
    f.writelines(lines)
