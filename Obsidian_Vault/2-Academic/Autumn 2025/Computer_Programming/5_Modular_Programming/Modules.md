---
title: Modules
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 2
mode: CS-SOFTWARE
read: false
generated: true
prerequisites:
- "[[Modular_Programming]]"
---

# 1. Mental Model
Imagine you have a big box full of LEGOs, and each LEGO piece represents a part of your program. A module is like a smaller box within the big box, where you can store a specific set of related LEGO pieces (or code) that can be easily used in different parts of your program. Just like how you can build a car with different LEGO pieces, a module helps you organize and reuse code.

# 2. Execution Logic & Data Flow
When a program uses a module, the [[Linker]] resolves the module's [[Symbol Table]] to map the module's functions and variables to the program's [[Address Space]]. The module's code is then loaded into memory, and its [[Exported_Symbols]] become available for use by the program. The program can call the module's functions, passing data as [[Function Arguments]], and receive [[Return Values]] in response. The module's internal state is encapsulated, meaning it's not directly accessible from outside the module.

# 3. Edge Cases & Failure States
When a module is loaded, the [[Dynamic_Linker]] checks for [[Symbol Resolution]] errors, which occur when the module depends on symbols that aren't available. If a module is missing a required [[Shared_Library]], the program may crash or behave unexpectedly. Additionally, if a module has [[Circular_Dependencies]], it can lead to [[Deadlocks]] or [[Infinite_Loops]] during initialization. A module's [[Namespace]] helps prevent [[Name Collisions]], but it's still possible for modules to interfere with each other if not designed carefully.
# 4. Implementation Mechanics
```python
# module_example.py
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b
```

```python
# main.py
import module_example

result = module_example.add(5, 3)
print(result)  # Output: 8

result = module_example.subtract(10, 4)
print(result)  # Output: 6
```
To read this code: The `module_example.py` file defines a module with two functions, `add` and `subtract`. The `main.py` file imports the `module_example` module and uses its functions to perform calculations.

## 5. Walkthrough
Here's a step-by-step walkthrough of how the module is implemented and used:

1. The `module_example.py` file is created with the `add` and `subtract` functions.
2. The `main.py` file imports the `module_example` module using the `import` statement.
3. The Python interpreter loads the `module_example` module into memory and resolves its symbol table.
4. The `main.py` file calls the `add` function from the `module_example` module, passing `5` and `3` as arguments.
5. The `add` function returns the result `8`, which is printed to the console.
6. The `main.py` file calls the `subtract` function from the `module_example` module, passing `10` and `4` as arguments.
7. The `subtract` function returns the result `6`, which is printed to the console.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "A module is like a smaller box within the big box, where you can store a specific set of related [[Blank1]] (or code) that can be easily used in different parts of your program.",
    "textWithBlanks": "A module is like a smaller box within the big box, where you can store a specific set of related [[Blank1]] (or code) that can be easily used in different parts of your program.",
    "answer": [
      "LEGO pieces"
    ],
    "explanation": "A module helps organize and reuse code by storing related functions and variables."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "When a module is loaded, its internal state is directly accessible from outside the module.",
    "answer": "False",
    "explanation": "A module's internal state is encapsulated, meaning it's not directly accessible from outside the module."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code.",
    "content": "def add(a, b):\n  return a + c\n\ndef subtract(a, b):\n  return a - b",
    "answer": "The bug is that the variable 'c' is not defined in the add function. The correct code should be: def add(a, b):\n  return a + b",
    "explanation": "The bug is a variable name error, where 'c' is not defined in the add function."
  }
]
```