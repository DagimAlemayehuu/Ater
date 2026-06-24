---
type: Atomic Note
chapter: "[[Chapter_05_Advanced_Git_Topics]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Git_Hooks.simple.html
  deep: lessons/Git_Hooks.deep.html
  cram: lessons/Git_Hooks.cram.html
  exam: lessons/Git_Hooks.exam.html
artifact_pack: database/General/Git/05_Advanced_Git_Topics/artifacts/Git_Hooks.artifacts.json
---

## Mental Model
Git hooks are scripts that run at specific points during Git workflows, allowing you to automate tasks, enforce rules, or send notifications. They are essentially a way to extend Git's functionality without modifying the core Git code. When you perform certain Git actions, like committing or pushing code, Git looks for hooks in your repository's `.git/hooks` directory and runs them if they exist. This lets you customize your workflow to fit your team's needs or project requirements.

## What You Must Know
Git hooks are scripts that can be written in any language, but they're usually written in Bash or Python for simplicity. There are two main types of hooks: client-side and server-side. Client-side hooks run on your local machine and can help with tasks like code formatting, testing, or ensuring commit messages follow a certain format. Server-side hooks, on the other hand, run on the remote repository server and are useful for enforcing project-wide policies, like requiring signed commits or restricting branch access.

Some common client-side hooks include:
- `pre-commit`: Runs just before you create a local commit.
- `prepare-commit-msg`: Runs after the commit message is prepared but before the commit message is saved.
- `post-commit`: Runs after a commit is made.

Server-side hooks include:
- `pre-receive`: Runs on the server before any references are updated.
- `update`: Runs on the server for each branch being updated.
- `post-receive`: Runs on the server after the references are updated.

## Common Mistakes
One common mistake is to make hooks executable but not properly handle the exit status. If a hook exits with a non-zero status, Git will abort the operation. For example, if your `pre-commit` hook finds issues but exits with a non-zero status, your commit won't be made. Another mistake is not considering cross-platform compatibility; for instance, a hook written in Bash might not work on Windows without proper adjustments.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Git_Hooks_core",
    "type": "mcq",
    "question": "What is the main job of Git hooks?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "Git hooks should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Git_Hooks_fill",
    "type": "fill_in",
    "question": "Git hooks is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Git_Hooks_teach_back",
    "type": "writing",
    "question": "Explain Git hooks in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```