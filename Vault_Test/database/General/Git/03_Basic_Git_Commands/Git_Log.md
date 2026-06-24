---
type: Atomic Note
chapter: "[[Chapter_03_Basic_Git_Commands]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Git_Log.simple.html
  deep: lessons/Git_Log.deep.html
  cram: lessons/Git_Log.cram.html
  exam: lessons/Git_Log.exam.html
artifact_pack: database/General/Git/03_Basic_Git_Commands/artifacts/Git_Log.artifacts.json
---

## Mental Model
Imagine you're working on a project and you want to keep track of all the changes you've made. You can think of Git like a time machine for your project. When you use `git log`, you're essentially asking Git to show you a list of all the changes you've made, in the order you made them. This list includes information like who made the change, when they made it, and what they changed.

## What You Must Know
`git log` is a command that displays a chronological list of commits made to a Git repository. A commit is like a snapshot of your project at a particular point in time. When you run `git log`, you'll see a list of commits, each with a unique hash code, the author's name and email, the date and time of the commit, and a brief description of the changes made.

## Common Mistakes
One common mistake is not understanding that `git log` only shows you commits that are part of the current branch you're on. If you want to see commits from other branches, you'll need to specify the branch name or use a different option with `git log`. Another mistake is not realizing that you can use various options with `git log` to customize the output, such as `--oneline` to show a concise log or `--graph` to visualize the commit history.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Git_Log_core",
    "type": "mcq",
    "question": "What is the main job of git log?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "git log should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Git_Log_fill",
    "type": "fill_in",
    "question": "git log is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Git_Log_teach_back",
    "type": "writing",
    "question": "Explain git log in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```