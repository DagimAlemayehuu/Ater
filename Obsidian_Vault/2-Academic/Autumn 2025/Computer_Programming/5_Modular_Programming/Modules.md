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
Imagine you have a big box full of LEGOs, and each LEGO piece represents a part of your program. A module is like a smaller box within the big box, where you can store a specific set of related LEGO pieces (or code) that can be easily taken out and used in other parts of your program or even in other programs. This helps keep your code organized and reusable.

# 2. Execution Logic & Data Flow
When a program uses a module, the module's code is loaded into memory, and its [[Exported_Symbols]] are made available to the program. The program can then call the module's functions or access its variables using the module's [[Namespace]]. The module's code executes in the program's [[Execution_Context]], and any errors that occur are handled according to the program's [[Error_Handling]] mechanisms. The module may also use [[Dynamic_Linking]] to resolve dependencies on other modules at runtime.

# 3. Edge Cases & Failure States
When a module is loaded, it may encounter [[Circular_Dependencies]], where two or more modules depend on each other, causing an infinite loop. Additionally, a module may fail to load due to [[Module_Not_Found]] errors or [[Syntax_Errors]] in the module's code. If a module is not properly [[Module_Initialized]], it may cause errors when the program tries to use it. Furthermore, [[Version_Conflicts]] between modules can lead to compatibility issues and errors.
# 4. Implementation Mechanics
```python
# example_module.py
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b
```

```python
# main.py
import example_module

result = example_module.add(5, 3)
print(result)  # Output: 8

result = example_module.subtract(10, 4)
print(result)  # Output: 6
```
To read this, we have two Python files: `example_module.py` which defines a module with two functions, `add` and `subtract`, and `main.py` which imports and uses these functions from the module.

## 5. Walkthrough
Here's a step-by-step walkthrough of how modules work in a realistic scenario:

1. **Module Creation**: A developer creates a new Python file called `math_utils.py` containing a set of related functions, such as `add`, `subtract`, `multiply`, and `divide`.

2. **Module Implementation**: The `math_utils.py` module is implemented as follows:
```python
# math_utils.py
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero!")
    return a / b
```

3. **Module Import**: Another Python script, `calculator.py`, imports the `math_utils` module:
```python
# calculator.py
import math_utils

def main():
    result = math_utils.add(5, 3)
    print(result)  # Output: 8

    result = math_utils.subtract(10, 4)
    print(result)  # Output: 6

if __name__ == "__main__":
    main()
```

4. **Module Execution**: When `calculator.py` is run, the `math_utils` module is loaded into memory, and its functions are made available to the `calculator.py` script.

5. **Function Call**: The `main` function in `calculator.py` calls the `add` and `subtract` functions from the `math_utils` module, which execute and return the results.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "A module is like a smaller [[Blank1]] within a program where you can store a specific set of related [[Blank2]].",
    "textWithBlanks": "A module is like a smaller [[Blank1]] within a program where you can store a specific set of related [[Blank2]].",
    "answer": [
      "box",
      "LEGO pieces (or code)"
    ],
    "explanation": "This question tests the definition of a module."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "When a module is loaded, its code executes immediately in the program's execution context.",
    "answer": "False",
    "explanation": "The module's code is loaded into memory, but it only executes when its functions or variables are called or accessed."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code.",
    "content": "def add(a, b):\n  return a +\ndef subtract(a, b):\n  return a - b",
    "answer": "The bug is a syntax error in the add function. The correct code should be: def add(a, b): return a + b",
    "explanation": "This question tests debugging skills."
  }
]
```