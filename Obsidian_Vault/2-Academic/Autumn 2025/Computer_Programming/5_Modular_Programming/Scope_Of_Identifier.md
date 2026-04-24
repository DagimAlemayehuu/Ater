---
title: Scope_of_Identifier
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
---

# 1. Mental Model
Imagine you have a big school with many classrooms. Each classroom has its own set of students, and each student has a name. The "scope" of a student's name is which classrooms that name is recognized in. If a student named John is in both the math and science classrooms, his name is accessible in both rooms, but not in the history classroom.

# 2. Execution Logic & Data Flow
The scope of an identifier in a program determines where that identifier can be accessed. When a compiler or interpreter encounters an identifier, it checks the [[Symbol_Table]] to resolve it to a specific [[Variable]] or [[Function]]. The scope is typically defined by [[Block_Scope]], which is determined by the placement of curly braces `{}` or other [[Scope_Resolution]] mechanisms in the code. The [[Call_Stack]] also plays a role in resolving identifiers during runtime, as it keeps track of the sequence of [[Stack_Frame]]s that are currently being executed.

# 3. Edge Cases & Failure States
The scope of an identifier can lead to issues if not managed properly. For example, if two variables with the same name are declared in different [[Scope]]s, it can lead to [[Name_Shadowing]], where the inner variable hides the outer one. Additionally, [[Global_Variables]] can be accessed from anywhere in the program, but their use can lead to [[Tight_Coupling]] and make code harder to reason about. [[Undeclared_Variables]] can also cause issues if they are used outside of their intended scope, leading to [[Runtime_Errors]].
# 4. Implementation Mechanics
```python
def outer_function():
    x = 10  # outer scope

    def inner_function():
        x = 20  # inner scope
        print("Inner function x:", x)

    inner_function()
    print("Outer function x:", x)

outer_function()
```
This code snippet demonstrates how the scope of an identifier works in Python. The variable `x` is declared in both the outer and inner functions, showcasing how the inner scope's `x` hides the outer scope's `x`.

To read this code: The `outer_function` has a variable `x` with value `10`. Inside `outer_function`, there's an `inner_function` that also declares a variable `x` with value `20`. When `inner_function` is called, it prints its local `x` (`20`), and then `outer_function` prints its own `x` (`10`).

## 5. Walkthrough
Consider a scenario where we have a simple calculator program with a global variable and a local variable:

1. We start with a global variable `result` initialized to `0`.
2. We define a function `add_numbers(a, b)` that declares a local variable `result` and calculates the sum of `a` and `b`, storing it in the local `result`.
3. We call `add_numbers(5, 7)`, which creates a new scope for the local `result`.
4. Inside `add_numbers`, we calculate `result = 5 + 7 = 12` and print the local `result`, which is `12`.
5. After `add_numbers` returns, we print the global `result`, which is still `0`, because the local `result` in `add_numbers` did not affect the global `result`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The scope of an identifier determines where that identifier can be [[Blank1]] in a program.",
    "textWithBlanks": "The scope of an identifier determines where that identifier can be [[Blank1]] in a program.",
    "answer": [
      "accessed"
    ],
    "explanation": "The scope of an identifier indeed determines where it can be accessed."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "In a program, a variable declared in an inner scope can be accessed from an outer scope.",
    "answer": "False",
    "explanation": "Generally, in programming, a variable declared in an inner scope cannot be accessed directly from an outer scope due to the principles of block scope and encapsulation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code snippet.",
    "content": "def calculate_sum(numbers):\ntotal = 0\nfor number in numbers:\ntotal = number\nreturn total",
    "answer": "{\"bug\": \"The line 'total = number' should be 'total += number' to accumulate the sum.\", \"corrected_code\": \"def calculate_sum(numbers):\\n  total = 0\\n  for number in numbers:\\n    total += number\\n  return total\"}",
    "explanation": "The original code does not accumulate the sum correctly; it only assigns the last number in the list to total."
  }
]
```