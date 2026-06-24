---
type: Atomic Note
chapter: "[[Chapter_03_Basic_Git_Operations]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Committing_Changes.simple.html
  deep: lessons/Committing_Changes.deep.html
  cram: lessons/Committing_Changes.cram.html
  exam: lessons/Committing_Changes.exam.html
artifact_pack: database/General/Git/03_Basic_Git_Operations/artifacts/Committing_Changes.artifacts.json
---

## Mental Model
When you make changes to your files in a Git repository, those changes aren't automatically saved or tracked by Git. To save and track your changes, you need to commit them. Think of committing like taking a snapshot of your project at a certain point in time. You include a message with your snapshot to describe what changes you made. This way, you can always look back and see what your project looked like at any point in the past.

## What You Must Know
To commit changes in Git, you use the `git commit` command. This command takes your staged changes (files you've told Git to track and include in the next snapshot) and creates a new commit. Each commit has a unique identifier, and it includes the changes you made, the date and time you made them, and the message you wrote to describe the changes.

## Common Mistakes
One common mistake is not staging changes before trying to commit them. Git only commits changes that have been staged using `git add`. If you try to commit without staging, Git won't include those changes in the commit. Another mistake is not writing a meaningful commit message. A good commit message helps you and others understand what changes were made and why.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Committing_Changes_core",
    "type": "mcq",
    "question": "What is the main job of Committing changes?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "Committing changes should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Committing_Changes_fill",
    "type": "fill_in",
    "question": "Committing changes is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Committing_Changes_teach_back",
    "type": "writing",
    "question": "Explain Committing changes in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```