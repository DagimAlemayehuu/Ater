---
title: Resolving Merge Conflicts In Git
type: Atomic Note
course: Resolving Merge Conflicts In Git
semester: Semester 1
unit: "1"
hub: "[[Resolving Merge Conflicts In Git_Hub]]"
source: "[[Interactive_Lessons]]"
mode: CS
read: false
generated: true
---

## Mental Model
Resolving merge conflicts in Git is like navigating a busy intersection where two roads meet. Imagine you're driving and approaching an intersection where another driver is also heading towards the same point; you both need to communicate and decide who goes first or how to merge safely. Similarly, when two developers work on the same code and try to merge their changes, Git helps identify where they've worked on the same parts and allows them to resolve these conflicts manually. Understanding this helps in anticipating and resolving conflicts efficiently.

## How It Works
When you merge two branches in Git, it attempts to automatically combine the changes. However, if the same part of the code has been modified in both branches, Git can't decide which change to keep and stops the merge process, indicating a conflict. You then manually review the conflicting changes, decide which ones to keep, and edit the files to resolve the conflict. After resolving conflicts, you add the files to staging with `git add`, and then complete the merge with `git merge --continue`. Understanding [[Git Merge]] and [[Conflict Markers]] is crucial for effectively resolving merge conflicts.

## Formal Model
A merge conflict occurs when Git cannot automatically merge changes from two branches because the changes are made to the same lines of code. Git uses conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) to highlight the conflicting changes in the file. The process involves:
- Identifying conflicts with `git status`
- Editing files to resolve conflicts
- Adding resolved files with `git add`
- Completing the merge with `git merge --continue`

```markdown
// Example of conflict markers in a file
<<<<<<< HEAD
This is the change from the current branch
=======
This is the change from the other branch
>>>>>>> other-branch
```

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "difficulty": "L1",
    "question": "What does Git use to indicate the start of a conflict in a merge?",
    "options": ["<<<<<<<", "=======", ">>>>>>>", "conflict"],
    "answer": "<<<<<<<",
    "explanation": "Git uses '<<<<<<<' to mark the beginning of a conflict area during a merge."
  },
  {
    "id": "q2",
    "type": "multiple-choice",
    "difficulty": "L2",
    "question": "After resolving a merge conflict, what command do you use to stage the resolved file?",
    "options": ["git commit", "git add", "git merge --continue", "git status"],
    "answer": "git add",
    "explanation": "After resolving a merge conflict, you use 'git add' to stage the resolved file, then 'git merge --continue' to complete the merge."
  }
]