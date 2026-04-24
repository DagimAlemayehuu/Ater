---
title: Recursion
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 46
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you have a set of Russian nesting dolls, where each doll is a smaller version of the same doll. Recursion is like a process that opens each doll, finds the smaller one inside, and repeats this process until it can't find another doll inside. This process of opening dolls inside dolls is similar to how a recursive function calls itself repeatedly until it reaches a simple case that can be solved directly.

# 2. Execution Logic & Data Flow
Recursion works mechanically by a function calling itself, creating a new [[Stack_Frame]] each time the function is invoked. Each recursive call must [[Base_Case|Eventually Reach A Base Case]] that stops the recursion, preventing infinite loops. The function's [[Local_Variables]] and parameters are pushed onto the call stack with each recursive call, and as each call returns, its stack frame is popped, and the previous call's state is restored. The return values from each recursive call are used to compute the final result. The process relies on the [[Call_Stack]] to manage the sequence of function calls and returns.

# 3. Edge Cases & Failure States
Recursion can lead to [[Stack_Overflow]] errors if the base case is not properly defined or if the recursive calls do not terminate. This occurs when the function calls itself too many times, exceeding the maximum size of the call stack. Another edge case is [[Infinite_Recursion]], where the function calls itself indefinitely because the base case is never met. Additionally, recursive functions can be less efficient than iterative solutions due to the overhead of creating and managing [[Stack_Frames]]. Careful consideration of the base case and the recursive call structure is necessary to avoid these failure states.
# 4. Implementation Mechanics
```python
def factorial(n):
  if n == 0:  # base case
    return 1
  else:
    return n * factorial(n-1)  # recursive call

# Example execution:
print(factorial(3))  # Output: 6
```
To read this, we see a Python function `factorial` that takes an integer `n`. The function calls itself with decreasing values of `n` until it reaches the base case (`n == 0`), at which point it starts returning values back up the call stack, ultimately computing the factorial of the original input.

## 5. Walkthrough
Let's walk through the execution of `factorial(3)`:

1. `factorial(3)` is called, pushing a stack frame with `n=3` onto the call stack.
2. Since `3 != 0`, `factorial(3)` calls `factorial(2)`, pushing a new stack frame with `n=2` onto the call stack.
3. Since `2 != 0`, `factorial(2)` calls `factorial(1)`, pushing a new stack frame with `n=1` onto the call stack.
4. Since `1 != 0`, `factorial(1)` calls `factorial(0)`, pushing a new stack frame with `n=0` onto the call stack.
5. Since `0 == 0`, `factorial(0)` returns `1` (base case), popping its stack frame.
6. `factorial(1)` returns `1 * 1 = 1`, popping its stack frame.
7. `factorial(2)` returns `2 * 1 = 2`, popping its stack frame.
8. `factorial(3)` returns `3 * 2 = 6`, popping its stack frame and yielding the final result.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "What is the primary mechanism that prevents infinite recursion in a recursive function?",
    "textWithBlanks": "The [[Base Case]] prevents infinite recursion by providing a stopping condition for the recursive calls.",
    "answer": [
      "base case"
    ],
    "explanation": "The base case is essential for terminating the recursion."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "Recursive functions are always more efficient than iterative solutions.",
    "answer": "False",
    "explanation": "Recursive functions can be less efficient due to the overhead of stack frame management."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given recursive function.",
    "content": "def sum_numbers(n):\n  if n > 0:\n    return n + sum_numbers(n)\n  else:\n    return 0",
    "answer": "The recursive call should be with n-1 instead of n to avoid infinite recursion.",
    "explanation": "The function calls itself with the same value of n, leading to infinite recursion."
  }
]
```