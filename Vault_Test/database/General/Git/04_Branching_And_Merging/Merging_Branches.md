---
type: Atomic Note
chapter: "[[Chapter_04_Branching_And_Merging]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Merging_Branches.simple.html
  deep: lessons/Merging_Branches.deep.html
  cram: lessons/Merging_Branches.cram.html
  exam: lessons/Merging_Branches.exam.html
artifact_pack: database/General/Git/04_Branching_And_Merging/artifacts/Merging_Branches.artifacts.json
---

## Mental Model
Imagine you're working on a project with many features. You want to add a new feature, but you're not sure if it will work well with the current version. Branching in Git helps you create a separate line of development for this new feature. When you're ready, you can merge this new branch back into the main project. Merging branches combines the changes from one branch into another. Think of it like combining two sets of papers into one organized stack.

## What You Must Know
To merge branches in Git, you need to understand a few key concepts:
- **Fast-forward merge**: When the branch you're merging from has no new commits that aren't already in the branch you're merging into, Git simply moves the pointer of the branch you're merging into to the tip of the branch you're merging from.
- **True merge**: If there are new commits in both branches, Git creates a new merge commit that combines both sets of changes. This creates a new snapshot that has two parent commits.
- **Merge conflicts**: Sometimes, changes in both branches affect the same lines of code. Git can't automatically merge these changes, so you have to resolve them manually.

## Common Mistakes
- Not pulling the latest changes before merging, which can lead to merge conflicts or unexpected behavior.
- Not using `git status` to check the status of the merge after conflicts are resolved.
- Forgetting to commit the merge with a meaningful message.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Merging_Branches_core",
    "type": "mcq",
    "question": "What is the main job of Merging branches?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "Merging branches should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Merging_Branches_fill",
    "type": "fill_in",
    "question": "Merging branches is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Merging_Branches_teach_back",
    "type": "writing",
    "question": "Explain Merging branches in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```