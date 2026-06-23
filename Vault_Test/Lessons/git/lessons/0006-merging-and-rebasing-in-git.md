---
title: Merging And Rebasing In Git
type: Atomic Note
course: Merging And Rebasing In Git
semester: Semester 1
unit: "1"
hub: "[[Merging And Rebasing In Git_Hub]]"
source: "[[Interactive_Lessons]]"
mode: CS
read: false
generated: true
---

## Mental Model
Merging and rebasing in Git are like integrating different streams of work into a main river, ensuring that all changes flow smoothly together. Imagine you're working on a project with multiple features, each developed in separate branches; merging is like directly pouring these features into the main branch, while rebasing is like re-streaming them one by one, making the history linear. Both methods help in combining work but differ in how they preserve history.

## How It Works
Merging and rebasing are two techniques used to integrate changes from one branch into another. [[Merging]] involves taking the contents of one branch and integrating them into another, creating a new merge commit that combines the histories of both branches. [[Rebasing]], on the other hand, replays the commits of one branch on top of another, rewriting the commit history to make it linear. [[Fast-forward merging]] occurs when the current branch is an ancestor of the other branch, allowing Git to simply move the pointer forward. The choice between merging and rebasing depends on the project's workflow and whether preserving a linear history is necessary.

## Formal Model
Merging can be represented by the following Git commands:
```bash
git checkout main
git merge feature-branch
```
Rebasing can be represented as:
```bash
git checkout feature-branch
git rebase main
```
This results in a linear history where commits from `feature-branch` are applied on top of `main`.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "difficulty": "L1",
    "question": "What is the primary difference between merging and rebasing in Git?",
    "options": [
      "Merging creates a new merge commit while rebasing rewrites history.",
      "Merging rewrites history while rebasing creates a new merge commit.",
      "Merging is used for local branches while rebasing is used for remote branches.",
      "Merging and rebasing are the same process."
    ],
    "answer": "Merging creates a new merge commit while rebasing rewrites history.",
    "explanation": "Merging integrates changes by creating a new merge commit, preserving the branch history. Rebasing replays commits on top of another branch, rewriting the history to appear linear."
  },
  {
    "id": "q2",
    "type": "multiple-choice",
    "difficulty": "L2",
    "question": "When is fast-forward merging used in Git?",
    "options": [
      "When the current branch is not an ancestor of the other branch.",
      "When the current branch is an ancestor of the other branch and there are no conflicts.",
      "When the other branch has no new commits.",
      "When there are merge conflicts."
    ],
    "answer": "When the current branch is an ancestor of the other branch and there are no conflicts.",
    "explanation": "Fast-forward merging occurs when the current branch is an ancestor of the branch being merged, and there are no conflicts, allowing Git to simply update the branch pointer."
  }
]