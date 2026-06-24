---
type: Atomic Note
chapter: "[[Chapter_03_Basic_Git_Commands]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Git_Add.simple.html
  deep: lessons/Git_Add.deep.html
  cram: lessons/Git_Add.cram.html
  exam: lessons/Git_Add.exam.html
artifact_pack: database/General/Git/03_Basic_Git_Commands/artifacts/Git_Add.artifacts.json
---

## Mental Model
Imagine you're working on a project and you've made some changes to your files. You want to save these changes so that you can go back to them later or share them with others. In Git, the `git add` command is like putting your changes into a box, preparing them to be saved. When you run `git add`, you're telling Git to stage your changes, which means you're selecting which changes you want to include in your next snapshot.

## What You Must Know
The `git add` command is used to stage changes in your working directory. You can stage specific files or all changes. Here are the basic ways to use `git add`:

- `git add <file>`: Stages a specific file.
- `git add .`: Stages all changes in the current directory and subdirectories.
- `git add -A`: Stages all changes in the entire repository.

## Common Mistakes
One common mistake is thinking that `git add` saves your changes permanently. However, it only stages them. To permanently save your changes, you need to use `git commit`. Another mistake is accidentally staging files you didn't intend to. You can use `git add -i` or `git add -p` to interactively stage changes, which can help prevent this.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Git_Add_core",
    "type": "mcq",
    "question": "What is the main job of git add?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "git add should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Git_Add_fill",
    "type": "fill_in",
    "question": "git add is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Git_Add_teach_back",
    "type": "writing",
    "question": "Explain git add in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```