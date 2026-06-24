---
type: Atomic Note
chapter: "[[Chapter_02_Setting_Up_Git]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Configuring_Git.simple.html
  deep: lessons/Configuring_Git.deep.html
  cram: lessons/Configuring_Git.cram.html
  exam: lessons/Configuring_Git.exam.html
artifact_pack: database/General/Git/02_Setting_Up_Git/artifacts/Configuring_Git.artifacts.json
---

## Mental Model
When you start using Git, it's like setting up a new notebook. You need to tell Git who you are so it can label your work correctly. This is done by configuring Git with your name and email address. Think of it like writing your name and address on the first page of your notebook, so anyone who finds it knows who it belongs to. When you configure Git, you're creating a global configuration that applies to all your Git projects. This configuration is stored in a file on your computer, and it's used by Git to identify you as the author of your commits.

## What You Must Know
To configure Git, you need to use the `git config` command. This command allows you to set your name and email address, which are used to identify you as the author of your commits. You can configure Git in two ways: globally or locally. Global configuration applies to all your Git projects, while local configuration applies only to a specific project. To set your global configuration, use the `--global` option with the `git config` command. For example, to set your name and email address globally, you would use the following commands:
```bash
git config --global user.name "Your Name"
git config --global user.email "youremail@example.com"
```
## Common Mistakes
One common mistake is not configuring Git correctly, which can lead to commits being labeled with the wrong name or email address. Another mistake is not understanding the difference between global and local configurations. Make sure to use the `--global` option carefully, as it can affect all your Git projects.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Configuring_Git_core",
    "type": "mcq",
    "question": "What is the main job of Configuring Git?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "Configuring Git should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Configuring_Git_fill",
    "type": "fill_in",
    "question": "Configuring Git is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Configuring_Git_teach_back",
    "type": "writing",
    "question": "Explain Configuring Git in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```