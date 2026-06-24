---
type: Atomic Note
chapter: "[[Chapter_01_Introduction_To_Git]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Brief_History_Of_Git.simple.html
  deep: lessons/Brief_History_Of_Git.deep.html
  cram: lessons/Brief_History_Of_Git.cram.html
  exam: lessons/Brief_History_Of_Git.exam.html
artifact_pack: database/General/Git/01_Introduction_To_Git/artifacts/Brief_History_Of_Git.artifacts.json
---

## Mental Model
Git is a version control system that helps you track changes in your code over time. Imagine you're working on a big project with many people, and you all need to make changes to the same files. Without a system to keep track of changes, it can get very confusing. That's where Git comes in. It was created by Linus Torvalds in 2005 to help manage the Linux kernel source code. Torvalds, the creator of Linux, wanted a system that was fast, flexible, and easy to use. He was inspired by other version control systems like BitKeeper and Subversion, but he wanted something that was more powerful and efficient.

## What You Must Know
Git is a distributed version control system, which means that every developer working on a project has a full copy of the entire project history on their local machine. This makes it easy to work offline and collaborate with others. Git stores changes in a series of commits, which are like snapshots of your code at a particular point in time. Each commit has a unique ID and includes information like the author's name and email, the date and time of the commit, and a brief description of the changes made.

## Common Mistakes
One common mistake people make when learning Git is thinking that it's only for big projects or teams. However, Git is useful for anyone who works on code, even if it's just a personal project. Another mistake is not understanding that Git is a local system, meaning that you can use it even without an internet connection. You can make changes, commit them, and then sync with a remote repository later.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Brief_History_Of_Git_core",
    "type": "mcq",
    "question": "What is the main job of Brief history of Git?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "Brief history of Git should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Brief_History_Of_Git_fill",
    "type": "fill_in",
    "question": "Brief history of Git is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Brief_History_Of_Git_teach_back",
    "type": "writing",
    "question": "Explain Brief history of Git in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```