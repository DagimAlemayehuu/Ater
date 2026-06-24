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
Git is a version control system that helps you track changes in your code over time. Imagine you're working on a big project with many pages, and you want to keep track of changes you make to each page. You could make a copy of the whole project every time you make a change, but that would take up a lot of space and be hard to manage. Instead, Git helps you keep a record of all the changes you make, so you can easily go back to a previous version if something goes wrong.

Git was created by Linus Torvalds in 2005. Torvalds is a well-known computer programmer who also created the Linux operating system. He needed a version control system for his Linux project, and he wanted one that was free, open-source, and could handle large projects. He based Git on an earlier system called BitKeeper, but he made significant changes to create a new system that was more powerful and flexible.

## What You Must Know
Git is a distributed version control system. This means that every person working on a project has a complete copy of the project's history on their own computer. This makes it easy to work on a project even when you're not connected to the internet. Git also allows multiple people to work on a project at the same time, and it helps you manage conflicts that arise when different people make changes to the same code.

## Common Mistakes
One common mistake people make when using Git is not understanding that it's a local system. This means that changes you make to your code aren't automatically saved to a central server. You need to use Git commands to save your changes and share them with others. Another mistake is not using meaningful commit messages. When you save changes with Git, you should write a clear message explaining what changes you made. This helps you and others understand the project's history.

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