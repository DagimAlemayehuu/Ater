---
title: Global_Identifier
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 18
mode: CS-SOFTWARE
read: false
generated: true
prerequisites:
- "[[Scope_Of_Identifier]]"
---

# 1. Mental Model
Imagine you have a big notebook that all the students in a school share. In this notebook, you write down names of people, and each name corresponds to a specific student. A Global Identifier is like a name written in this shared notebook, accessible from any classroom in the school. It's a name or label that is not confined to a specific part of the program but can be used throughout.

# 2. Execution Logic & Data Flow
In programming, a Global Identifier is a variable or function name declared outside of every [[Function_Definition]]. This means it is not enclosed within any [[Block_Scope]], making it accessible from any part of the program. When the program starts, memory is allocated for global variables, and they remain in memory until the program terminates. The [[Linker]] resolves references to global identifiers, ensuring that all parts of the program use the same memory location for a given identifier. The [[Scope_Resolution]] for global identifiers is straightforward: if an identifier is not found in the local or enclosing scopes, the program looks for it in the global scope.

# 3. Edge Cases & Failure States
Global identifiers can lead to name clashes if multiple parts of a program use the same name for different variables or functions. This can be mitigated by using [[Hungarian_Notation]] or other naming conventions. When a global variable is modified within a [[Stack_Frame]], its value changes for all parts of the program that access it. Additionally, global identifiers can make code harder to understand and debug because their values can change from anywhere in the program, making [[Referential_Transparency]] difficult to achieve. It's also worth noting that some programming languages restrict or discourage the use of global identifiers to encourage more modular and maintainable code.
# 4. Implementation Mechanics
```python
# Global variable declaration
global_variable = 10

def function1():
    # Accessing global variable
    print("Function 1:", global_variable)

def function2():
    # Modifying global variable
    global global_variable
    global_variable = 20
    print("Function 2:", global_variable)

function1()
function2()
function1()
```
This code snippet demonstrates how a global variable `global_variable` is declared and accessed from different functions. The `function2` modifies the global variable, which affects its value in `function1`.

---

## 5. Walkthrough
Here's a step-by-step walkthrough of how global identifiers work in a program:

1. **Global Variable Declaration**: A global variable `global_variable` is declared and initialized with the value `10`.
2. **Memory Allocation**: Memory is allocated for `global_variable` when the program starts.
3. **Function 1 Execution**: `function1` is called, which accesses and prints the current value of `global_variable`, which is `10`.
4. **Function 2 Execution**: `function2` is called, which modifies the value of `global_variable` to `20` and prints the new value.
5. **Global Variable Update**: Since `global_variable` is a global identifier, its value is updated for all parts of the program.
6. **Function 1 Execution (Again)**: `function1` is called again, which accesses and prints the updated value of `global_variable`, now `20`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "A Global Identifier is a variable or function name declared [[Blank1]] of every function definition.",
    "textWithBlanks": "A Global Identifier is a variable or function name declared [[Blank1]] of every function definition.",
    "answer": [
      "outside"
    ],
    "explanation": "Global identifiers are declared outside of every function definition, making them accessible from any part of the program."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "Global identifiers can lead to name clashes if multiple parts of a program use the same name for different variables or functions.",
    "answer": "True",
    "explanation": "Global identifiers can indeed lead to name clashes if not managed properly, which can cause issues in program execution."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code.",
    "content": "x = 5\ndef foo():\n    x = x + 1\n    print(x)\nfoo()\nprint(x)",
    "answer": "The bug is that the global variable x is not declared as global in the foo function. The correct code should be:\n x = 5\ndef foo():\n    global x\n    x = x + 1\n    print(x)\nfoo()\nprint(x)",
    "explanation": "The bug is due to the missing global declaration in the foo function, which causes the program to create a local variable x instead of modifying the global variable."
  }
]
```