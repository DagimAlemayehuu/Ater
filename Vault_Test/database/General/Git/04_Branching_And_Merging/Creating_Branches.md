---
type: Atomic Note
chapter: "[[Chapter_04_Branching_And_Merging]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Creating_Branches.simple.html
  deep: lessons/Creating_Branches.deep.html
  cram: lessons/Creating_Branches.cram.html
  exam: lessons/Creating_Branches.exam.html
artifact_pack: database/General/Git/04_Branching_And_Merging/artifacts/Creating_Branches.artifacts.json
---

## Mental Model
Imagine you're working on a big project, like building a treehouse. You want to try out a new idea, like adding a secret passage, but you're not sure if it will work. A branch in Git is like a separate area where you can build your secret passage without affecting the main treehouse. You can work on your new idea, test it, and if it doesn't work out, you can just close that area and go back to the main treehouse. But if it does work out, you can bring it back to the main treehouse and add it in. This way, you can try out new things without risking your main project.

## What You Must Know
To create a branch in Git, you use the command `git branch <branch-name>`. This creates a new branch that starts at the current commit. You can then switch to that branch using `git checkout <branch-name>`. Once you're on the new branch, any commits you make will be on that branch, not on the main branch (usually called `main` or `master`). 

## Common Mistakes
A common mistake is to think that creating a branch automatically switches you to that branch. However, you still need to use `git checkout` or `git switch` to start working on the new branch. Another mistake is not realizing that branches are lightweight and easy to create, so don't be afraid to create a new branch for a new feature or bug fix.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Creating_Branches_core",
    "type": "mcq",
    "question": "What is the main job of Creating branches?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "Creating branches should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Creating_Branches_fill",
    "type": "fill_in",
    "question": "Creating branches is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Creating_Branches_teach_back",
    "type": "writing",
    "question": "Explain Creating branches in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```