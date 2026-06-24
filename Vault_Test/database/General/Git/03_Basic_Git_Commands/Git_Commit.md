---
type: Atomic Note
chapter: "[[Chapter_03_Basic_Git_Commands]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Git_Commit.simple.html
  deep: lessons/Git_Commit.deep.html
  cram: lessons/Git_Commit.cram.html
  exam: lessons/Git_Commit.exam.html
artifact_pack: database/General/Git/03_Basic_Git_Commands/artifacts/Git_Commit.artifacts.json
---

## Mental Model
Imagine you're working on a project and you've made some changes to your files. You want to save these changes so you can remember what you did and go back to them later. In Git, this process is called committing. When you commit, you're creating a snapshot of your project at a specific point in time. This snapshot is like a photo of your project, and it's stored in your Git repository. Every commit has a unique ID, and it includes information like who made the changes, when they were made, and what files were changed.

## What You Must Know
To commit changes in Git, you use the `git commit` command. This command takes the changes you've staged (selected to be part of the next commit) and creates a new commit. You must always include a meaningful commit message that describes the changes you made. This message should be short but informative, and it's written using the `-m` option followed by the message in quotes. For example: `git commit -m "Added a new feature to the login system"`. 

## Common Mistakes
One common mistake is not including a commit message. Git will not let you create a commit without one. Another mistake is not staging changes before committing. If you try to commit without staging, Git won't include those changes in the commit. 

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Git_Commit_core",
    "type": "mcq",
    "question": "What is the main job of git commit?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "git commit should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Git_Commit_fill",
    "type": "fill_in",
    "question": "git commit is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Git_Commit_teach_back",
    "type": "writing",
    "question": "Explain git commit in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```