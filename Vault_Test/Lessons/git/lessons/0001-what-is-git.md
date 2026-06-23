---
title: What Is Git?
type: Atomic Note
course: What Is Git?
semester: Semester 1
unit: "1"
hub: "[[What Is Git?_Hub]]"
source: "[[Interactive_Lessons]]"
mode: CS
read: false
generated: true
---

## Mental Model
Git is like a time machine for your code, allowing you to track changes, collaborate with others, and manage different versions of your project. Just as a historian uses archives to understand the past, Git helps developers understand the evolution of their codebase. By creating a snapshot of your project at different points in time, Git enables you to navigate through changes and collaborate efficiently.

## How It Works
Git is a distributed version control system that allows developers to track changes in their codebase over time. When you create a Git repository, it stores all the changes you make to your code, along with a description of each change, known as a commit. This enables you to revert to previous versions of your code if something goes wrong. Git also facilitates collaboration by allowing multiple developers to work on the same project simultaneously, using [[branches]] to manage different versions of the code. By [[committing]] changes and [[pushing]] them to a remote repository, developers can share their work with others and ensure that everyone has access to the latest version of the code.

## Formal Model
Git can be formally defined as a directed acyclic graph (DAG) of commits, where each commit represents a snapshot of the codebase at a particular point in time. The Git repository stores all the commits, along with their relationships, in a data structure known as a [[Git Graph]]. This graph is used to compute the history of the codebase and to facilitate collaboration among developers.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "difficulty": "L1",
    "question": "What is the primary purpose of Git?",
    "options": [
      "To write code",
      "To track changes in the codebase over time",
      "To manage different versions of a project",
      "To collaborate with other developers"
    ],
    "answer": "To track changes in the codebase over time",
    "explanation": "Git is a version control system that helps developers track changes in their codebase over time."
  },
  {
    "id": "q2",
    "type": "multiple-choice",
    "difficulty": "L2",
    "question": "What is a commit in Git?",
    "options": [
      "A snapshot of the codebase at a particular point in time",
      "A change to the codebase",
      "A branch in the codebase",
      "A remote repository"
    ],
    "answer": "A snapshot of the codebase at a particular point in time",
    "explanation": "In Git, a commit represents a snapshot of the codebase at a particular point in time, along with a description of the changes made."
  }
]