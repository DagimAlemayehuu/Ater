---
type: Atomic Note
chapter: "[[Chapter_03_Basic_Git_Commands]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Git_Init.simple.html
  deep: lessons/Git_Init.deep.html
  cram: lessons/Git_Init.cram.html
  exam: lessons/Git_Init.exam.html
artifact_pack: database/General/Git/03_Basic_Git_Commands/artifacts/Git_Init.artifacts.json
---

## Mental Model
Imagine you have a folder on your computer where you're working on a project, like a school assignment or a personal website. You want to keep track of changes you make to your project over time, so you can go back to a previous version if something goes wrong. That's where Git comes in. When you use `git init` in your project folder, you're telling Git to start tracking changes in that folder. This is like creating a special notebook that records every change you make.

## What You Must Know
`git init` is a basic Git command that initializes a new Git repository in your current directory. When you run `git init`, Git creates a hidden folder called `.git` in your project folder. This `.git` folder stores all the information Git needs to track changes in your project. After running `git init`, you can start using other Git commands to add files, commit changes, and more.

## Common Mistakes
One common mistake is running `git init` in the wrong directory. Make sure you're in the correct project folder before running the command. Another mistake is not checking if Git has successfully initialized the repository. You can verify this by running `git status`, which should tell you that you're in a new Git repository.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Git_Init_core",
    "type": "mcq",
    "question": "What is the main job of git init?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "git init should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Git_Init_fill",
    "type": "fill_in",
    "question": "git init is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Git_Init_teach_back",
    "type": "writing",
    "question": "Explain git init in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```