---
type: Atomic Note
chapter: "[[Chapter_03_Basic_Git_Operations]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Adding_Files_To_A_Repository.simple.html
  deep: lessons/Adding_Files_To_A_Repository.deep.html
  cram: lessons/Adding_Files_To_A_Repository.cram.html
  exam: lessons/Adding_Files_To_A_Repository.exam.html
artifact_pack: database/General/Git/03_Basic_Git_Operations/artifacts/Adding_Files_To_A_Repository.artifacts.json
---

## Mental Model
When you create a Git repository, it's like setting up an empty folder on your computer where you can store and manage your files. To start using this folder, you need to add your files to it. In Git, this process involves two main steps: staging and committing. Think of staging like putting files into a box, preparing them to be saved. Committing is like sealing the box and writing down what you've saved, so you can remember later. The command to add files to this "box" (or repository) is `git add`. When you use `git add`, you're telling Git which files you want to include in your next commit.

## What You Must Know
- The basic command to add a file to your Git repository is `git add [file_name]`.
- You can add multiple files by listing them one by one: `git add file1.txt file2.txt`.
- To add all files in your directory, you can use `git add .`.
- The staging area is a middle ground where files are queued to be committed.
- Use `git status` to see which files are staged and which are not.

## Common Mistakes
- Forgetting to specify which files to add, leading to confusion about what changes are being tracked.
- Not using `git status` to verify which files have been added to the staging area.
- Assuming that adding a file to the staging area means it's saved; it isn't until you commit.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Adding_Files_To_A_Repository_core",
    "type": "mcq",
    "question": "What is the main job of Adding files to a repository?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "Adding files to a repository should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Adding_Files_To_A_Repository_fill",
    "type": "fill_in",
    "question": "Adding files to a repository is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Adding_Files_To_A_Repository_teach_back",
    "type": "writing",
    "question": "Explain Adding files to a repository in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```