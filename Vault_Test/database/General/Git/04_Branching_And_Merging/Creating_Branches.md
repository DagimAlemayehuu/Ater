---
type: Atomic Note
chapter: "[[Chapter_04_Branching_And_Merging]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Creating_Branches.simple.html
  deep: lessons/Creating_Branches.deep.html
  cram: lessons/Creating_Branches.cram.html
  exam: lessons/Creating_Branches.exam.html
artifact_pack: database/General/Git/04_Branching_And_Merging/artifacts/Creating_Branches.artifacts.json
---

## Mental Model
Imagine you're working on a big project, like building a treehouse. You want to try out a new idea, like adding a secret passage, but you're not sure if it will work. A branch in Git is like a separate blueprint for your treehouse. You can make changes to the blueprint without affecting the main plan. This way, you can experiment with your new idea without messing up the original treehouse. When you're happy with your changes, you can merge your new blueprint back into the main plan.

## What You Must Know
To create a branch in Git, you use the command `git branch <branch-name>`. This creates a new branch that points to the current commit. You can then switch to the new branch using `git checkout <branch-name>`. Any changes you make will be stored in this new branch. It's like creating a new folder for your treehouse blueprints.

## Common Mistakes
One common mistake is not switching to the new branch after creating it. You might make changes, but they won't be saved in the new branch. Always remember to use `git checkout <branch-name>` to switch to the branch you want to work on. Another mistake is not committing changes before switching back to the main branch. This can cause problems when you try to merge the branches later.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Creating_Branches_core",
    "type": "mcq",
    "question": "What is the main job of Creating branches?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "Creating branches should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Creating_Branches_fill",
    "type": "fill_in",
    "question": "Creating branches is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Creating_Branches_teach_back",
    "type": "writing",
    "question": "Explain Creating branches in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```