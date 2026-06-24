---
type: Atomic Note
chapter: "[[Chapter_02_Setting_Up_Git]]"
hub: "[[Git_Hub]]"
lesson_variants:
  simple: lessons/Installing_Git.simple.html
  deep: lessons/Installing_Git.deep.html
  cram: lessons/Installing_Git.cram.html
  exam: lessons/Installing_Git.exam.html
artifact_pack: database/General/Git/02_Setting_Up_Git/artifacts/Installing_Git.artifacts.json
---

## Mental Model
When you start using Git, the first thing you need to do is install it on your computer. Think of Git like a tool that helps you keep track of changes in your project files. Just like how you need a screwdriver to drive screws, you need Git to manage your project's files. Installing Git is like putting the right tool in your toolbox so you can start building and tracking changes.

## What You Must Know
To install Git, you need to follow these steps:
- **For Windows**: Download the Git installer from the official Git website. Run the installer and follow the prompts. Make sure to select the option to install Git Bash, which is a command-line interface that makes it easier to use Git.
- **For macOS (with Homebrew)**: If you have Homebrew installed, you can simply run `brew install git` in your terminal.
- **For Linux**: You can install Git using your distribution's package manager. For example, on Ubuntu or Debian, run `sudo apt-get install git`.

## Common Mistakes
One common mistake is not verifying that Git was installed correctly. After installation, open a new command-line interface (like Command Prompt on Windows or Terminal on macOS/Linux) and type `git --version`. If Git is installed correctly, you should see the version number. If not, you might need to add Git to your system's PATH or reinstall it.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "Installing_Git_core",
    "type": "mcq",
    "question": "What is the main job of Installing Git?",
    "options": {
      "A": "To explain the core idea in simple words",
      "B": "To hide the important rule",
      "C": "To skip practice",
      "D": "To memorize unrelated facts"
    },
    "answer": "A",
    "explanation": "Installing Git should first be understood as a clear, usable idea inside Git."
  },
  {
    "id": "Installing_Git_fill",
    "type": "fill_in",
    "question": "Installing Git is useful because it helps you track the important ______ in Git.",
    "answer": "change",
    "explanation": "Learning becomes useful when you can explain what changes and why it matters."
  },
  {
    "id": "Installing_Git_teach_back",
    "type": "writing",
    "question": "Explain Installing Git in two simple sentences and give one concrete example.",
    "answer": "A strong answer defines the idea, gives a concrete example, and avoids unnecessary jargon.",
    "explanation": "Teach-back checks whether you can produce the idea from memory."
  }
]
```