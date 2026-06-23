---
title: Basic Git Operations
type: Atomic Note
course: Basic Git Operations
semester: Semester 1
unit: "1"
hub: "[[Basic Git Operations_Hub]]"
source: "[[Interactive_Lessons]]"
mode: CS
read: false
generated: true
---

## Mental Model
Imagine a librarian who keeps track of all the changes made to a book. The librarian uses a system to record who made changes, what changes were made, and when they were made. Similarly, Git uses a system to track changes made to code, allowing developers to collaborate and manage different versions of their project.

## How It Works
Basic Git operations include commands like `git add`, `git commit`, and `git log`. The `git add` command stages changes to be committed, while `git commit` records changes with a meaningful message. The `git log` command displays a history of all commits made to the repository. These commands work together to help developers track changes and collaborate with others. Understanding [[Git Repository]], [[Git Staging Area]], and [[Git Commit History]] is essential to mastering basic Git operations.

## Formal Model
The basic Git operations can be defined as follows:
- `git add <file>`: Stages changes to the specified file.
- `git commit -m "<message>"`: Commits changes with a meaningful message.
- `git log`: Displays a log of all commits made to the repository.

```bash
git add .
git commit -m "Initial commit"
git log
```

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "difficulty": "L1",
    "question": "What is the purpose of the `git add` command?",
    "options": [
      "To commit changes",
      "To stage changes to be committed",
      "To display commit history",
      "To create a new repository"
    ],
    "answer": "To stage changes to be committed",
    "explanation": "The `git add` command stages changes to be committed, allowing developers to review and organize changes before recording them in the commit history."
  },
  {
    "id": "q2",
    "type": "multiple-choice",
    "difficulty": "L2",
    "question": "What is the purpose of the `-m` option in the `git commit` command?",
    "options": [
      "To specify the files to commit",
      "To provide a meaningful commit message",
      "To display commit history",
      "To stage changes"
    ],
    "answer": "To provide a meaningful commit message",
    "explanation": "The `-m` option in the `git commit` command allows developers to provide a clear and concise message describing the changes made in the commit."
  }
]