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
Imagine you're working on a project with multiple features. You want to develop each feature separately without affecting the main project. This is where Git branching comes in. You create a new branch for each feature, and when you're done, you merge it back into the main branch. Merging branches is like combining the changes from one branch into another. Think of it like folding a new piece of paper into your main notebook. You're taking the new work and adding it to the existing work.

## What You Must Know
To merge branches in Git, you need to understand the following:
- The `git merge` command is used to merge changes from one branch into another.
- The branch you're merging into is called the target branch, and the branch you're merging from is called the source branch.
- Git uses a simple 3-way merge algorithm to combine changes. It finds the common base between the two branches, then applies the changes from both branches.
- You can use `git merge --no-ff` to create a merge commit even if a fast-forward merge is possible.

## Common Mistakes
- Not pulling the latest changes from the target branch before merging, which can lead to conflicts.
- Not resolving conflicts properly, which can cause changes to be lost.
- Merging into the wrong branch, which can cause chaos in your project.

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