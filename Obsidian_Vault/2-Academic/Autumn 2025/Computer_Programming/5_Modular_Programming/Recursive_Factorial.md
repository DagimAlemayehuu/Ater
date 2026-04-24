---
title: Recursive_Factorial
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 51
mode: CS-SOFTWARE
read: false
generated: true
prerequisites:
- "[[Recursion]]"
---

# 1. Mental Model
Imagine you have a bunch of toy boxes stacked on top of each other, and in each box, there's a note that says "multiply me by the number in the box below". The top box has a note that says "1" because there's no box below it. This is similar to how the recursive factorial works, where each call to `factorial` is like a box that multiplies its number by the result of the box below it, until it reaches the base case.

# 2. Execution Logic & Data Flow
The recursive factorial function works by checking if the input `n` is less than or equal to 1, which is the [[Base_Case]] that stops the recursion. If `n` is 1 or 0, the function returns 1, as `factorial(0)` and `factorial(1)` are both defined to be 1. Otherwise, the function calls itself with the argument `n-1`, and multiplies the result by `n`. This process creates a [[Call_Stack]] of function calls, where each call is waiting for the result of the call below it. The [[Stack_Frame]] for each call contains the local variables and parameters, including the current value of `n`. The function uses [[Recursion]] to calculate the factorial, relying on the [[Last_In_First_Out]] property of the call stack to manage the return values.

# 3. Edge Cases & Failure States
The recursive factorial function has some edge cases to consider. If the input `n` is 0 or 1, the function returns 1, which is the correct result. However, if `n` is a large number, the function may cause a [[Stack_Overflow]] because each recursive call adds a new layer to the call stack. Additionally, if `n` is a negative number, the function will not terminate because the [[Base_Case]] is never reached. The function also uses [[Unsigned_Arithmetic]], which means that if `n` is too large, the result will wrap around to a smaller value, causing an incorrect result. For very large inputs, an [[Integer_Overflow]] may occur, causing the function to produce an incorrect result.
# 4. Implementation Mechanics
```python
def factorial(n):
    if n <= 1:  # Base case
        return 1
    else:
        return n * factorial(n-1)  # Recursive call
```
This code snippet shows the recursive implementation of the factorial function. The base case is when `n` is less than or equal to 1, at which point the function returns 1. Otherwise, the function calls itself with `n-1` and multiplies the result by `n`.

The recursive call stack can be visualized as follows:
- `factorial(n)` calls `factorial(n-1)`
- `factorial(n-1)` calls `factorial(n-2)`
- ...
- `factorial(1)` returns 1 (base case)

## 5. Walkthrough
Let's walk through the calculation of `factorial(4)`:

1. `factorial(4)` is called, which calls `factorial(3)`
2. `factorial(3)` is called, which calls `factorial(2)`
3. `factorial(2)` is called, which calls `factorial(1)`
4. `factorial(1)` returns 1 (base case)
5. `factorial(2)` returns 2 * 1 = 2
6. `factorial(3)` returns 3 * 2 = 6
7. `factorial(4)` returns 4 * 6 = 24

The final result is `24`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The recursive factorial function uses a [[Base_Case]] to stop the recursion when the input is [[Blank1]] or [[Blank2]].",
    "textWithBlanks": "The recursive factorial function uses a [[Base_Case]] to stop the recursion when the input is [[Blank1]] or [[Blank2]].",
    "answer": [
      "0",
      "1"
    ],
    "explanation": "The base case for the recursive factorial function is when the input is 0 or 1."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "The recursive factorial function can handle large input values without causing a stack overflow.",
    "answer": "False",
    "explanation": "The recursive factorial function can cause a stack overflow for large input values because each recursive call adds a new layer to the call stack."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code.",
    "content": "def factorial(n):\n  if n > 1:\n    return n * factorial(n-1)\n  else:\n    return n",
    "answer": "The bug is that the function does not handle the case when n is 0 correctly. The function should return 1 when n is 0 or 1.",
    "explanation": "The corrected code should be: def factorial(n):\n  if n <= 1:\n    return 1\n  else:\n    return n * factorial(n-1)"
  }
]
```