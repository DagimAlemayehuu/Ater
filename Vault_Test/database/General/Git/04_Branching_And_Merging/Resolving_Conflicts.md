---
type: Atomic Note
chapter: "[[Chapter_04_Branching_And_Merging]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Resolving_Conflicts.simple.html
  deep: lessons/Resolving_Conflicts.deep.html
  cram: lessons/Resolving_Conflicts.cram.html
  exam: lessons/Resolving_Conflicts.exam.html
artifact_pack: database/General/Git/04_Branching_And_Merging/artifacts/Resolving_Conflicts.artifacts.json
---

## Mental Model
When you're working with Git, you might make changes to your code in one branch, and someone else might make changes to the same part of the code in another branch. When you try to merge these branches together, Git might get confused and create a conflict. A conflict happens when Git can't automatically combine the changes from both branches. Imagine you and a friend are both writing a story on the same page. You write a sentence, and your friend writes another sentence on the same line. When you try to put both stories together, you need to decide which sentence to keep and which one to throw away. Resolving conflicts in Git is similar, but instead of sentences, you're working with code.

## What You Must Know
To resolve conflicts in Git, you need to understand how Git identifies conflicts and the steps to take to resolve them. When Git tries to merge two branches and finds a conflict, it will pause the merge process and alert you to the conflict. You'll see conflict markers in your code, like `<<<<<<<`, `=======`, and `>>>>>>>`, which show where the conflict is. These markers separate the changes from both branches. To fix the conflict, you need to decide which changes to keep or if you want to combine them.

## Common Mistakes
A common mistake when resolving conflicts is not understanding which changes are coming from which branch. This can lead to accidentally deleting someone else's work or overwriting your own changes. Another mistake is not testing the code after resolving the conflict, which can lead to bugs or broken functionality. It's also easy to forget to remove the conflict markers, which can cause confusion for others working on the project.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Resolving_Conflicts_core",
    "type": "mcq",
    "question": "What is the main job of Resolving conflicts?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "Resolving conflicts should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Resolving_Conflicts_fill",
    "type": "fill_in",
    "question": "Resolving conflicts is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Resolving_Conflicts_teach_back",
    "type": "writing",
    "question": "Explain Resolving conflicts in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```