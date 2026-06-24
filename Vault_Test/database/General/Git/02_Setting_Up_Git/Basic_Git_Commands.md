---
type: Atomic Note
chapter: "[[Chapter_02_Setting_Up_Git]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Basic_Git_Commands.simple.html
  deep: lessons/Basic_Git_Commands.deep.html
  cram: lessons/Basic_Git_Commands.cram.html
  exam: lessons/Basic_Git_Commands.exam.html
artifact_pack: database/General/Git/02_Setting_Up_Git/artifacts/Basic_Git_Commands.artifacts.json
---

## Mental Model
Imagine you're working on a big project with many friends. You all need to make changes to the project, but you don't want to mess up each other's work. That's where Git comes in. Git is like a magic notebook that helps you keep track of all the changes you make to your project. When you use Git, you create a special folder called a "repository" (or "repo" for short). This repo is like a safe box where you can store all your project files and keep track of changes.

## What You Must Know
To start using Git, you need to know some basic commands. Here are the most important ones:
- `git init`: This command creates a new Git repository in your current folder.
- `git add <file>`: This command tells Git to include a specific file in the next "snapshot" of your project.
- `git commit -m "<message>"`: This command creates a new "snapshot" of your project, with a message that describes what changes you made.
- `git status`: This command shows you which files have changed and which are ready to be committed.

## Common Mistakes
One common mistake is forgetting to add files to Git before committing. If you make changes to a file but don't add it to Git, those changes won't be saved in your project's history. Another mistake is using vague commit messages. It's a good idea to write clear, descriptive messages that explain what changes you made.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Basic_Git_Commands_core",
    "type": "mcq",
    "question": "What is the main job of Basic Git commands?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "Basic Git commands should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Basic_Git_Commands_fill",
    "type": "fill_in",
    "question": "Basic Git commands is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Basic_Git_Commands_teach_back",
    "type": "writing",
    "question": "Explain Basic Git commands in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```