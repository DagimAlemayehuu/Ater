---
type: Atomic Note
chapter: "[[Chapter_03_Basic_Git_Operations]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Creating_A_Repository.simple.html
  deep: lessons/Creating_A_Repository.deep.html
  cram: lessons/Creating_A_Repository.cram.html
  exam: lessons/Creating_A_Repository.exam.html
artifact_pack: database/General/Git/03_Basic_Git_Operations/artifacts/Creating_A_Repository.artifacts.json
---

## Mental Model
Imagine you're starting a new project, and you want to keep track of all the changes you make to your files. A repository, or "repo" for short, is like a folder where you can store all your project files and keep a history of all the changes you make. When you create a repository, you're setting up a new project in Git. Think of it like creating a new notebook where you'll write down all your project's history.

## What You Must Know
To create a repository, you can use the command `git init`. This command initializes a new Git repository in your current directory. A directory is just a folder on your computer. When you run `git init`, Git creates a new folder called `.git` inside your project folder. This `.git` folder is where Git stores all the information it needs to keep track of your project's history.

## Common Mistakes
One common mistake is thinking that `git init` creates a repository on a remote server, like GitHub or GitLab. But `git init` only creates a repository on your local computer. If you want to share your repository with others or store it online, you'll need to create a repository on a remote server and then link it to your local repository.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Creating_A_Repository_core",
    "type": "mcq",
    "question": "What is the main job of Creating a repository?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "Creating a repository should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Creating_A_Repository_fill",
    "type": "fill_in",
    "question": "Creating a repository is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Creating_A_Repository_teach_back",
    "type": "writing",
    "question": "Explain Creating a repository in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```