---
type: Atomic Note
chapter: "[[Chapter_04_Branching_And_Merging]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Resolving_Conflicts.simple.html
  deep: lessons/Resolving_Conflicts.deep.html
  cram: lessons/Resolving_Conflicts.cram.html
  exam: lessons/Resolving_Conflicts.exam.html
artifact_pack: database/General/Git/04_Branching_And_Merging/artifacts/Resolving_Conflicts.artifacts.json
---

## Mental Model
When you're working with Git, you might make changes to your code in one branch, and someone else might make changes to the same part of the code in another branch. When you try to merge these branches together, Git might get confused and not know which changes to keep. This is called a conflict. Resolving conflicts is like being a referee in a disagreement between two people. You have to look at both sets of changes and decide which ones make the most sense to keep. Git helps you by marking the areas where the changes don't match, and then you can decide what to do.

## What You Must Know
To resolve conflicts in Git, you need to understand how Git identifies conflicts and how to use its tools to fix them. When Git can't automatically merge changes, it will pause the merge process and let you know where the conflicts are. You'll see special markers in your code: `<<<<<<<`, `=======`, and `>>>>>>>`. These markers show where the conflicting changes start and end. You'll need to manually edit the code to choose which changes to keep.

## Common Mistakes
One common mistake is trying to merge branches without pulling the latest changes from the remote repository. This can lead to unexpected conflicts. Another mistake is not using `git status` to check which files are causing conflicts. Without this information, you might try to resolve conflicts in the wrong files or miss some conflicts altogether.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Resolving_Conflicts_core",
    "type": "mcq",
    "question": "What is the main job of Resolving conflicts?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "Resolving conflicts should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Resolving_Conflicts_fill",
    "type": "fill_in",
    "question": "Resolving conflicts is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Resolving_Conflicts_teach_back",
    "type": "writing",
    "question": "Explain Resolving conflicts in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```