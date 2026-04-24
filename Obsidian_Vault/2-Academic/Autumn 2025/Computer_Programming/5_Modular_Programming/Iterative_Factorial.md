---
title: Iterative_Factorial
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 50
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you have a bunch of boxes where you can store candies, and you want to put a certain number of candies in each box. The iterative factorial is like a process where you start with one candy in the first box, then for each subsequent box, you multiply the number of candies in the previous box by the box number. For example, if you have 5 boxes, you start with 1 candy in the first box, then 1*2=2 candies in the second box, 2*3=6 candies in the third box, and so on.

# 2. Execution Logic & Data Flow
The iterative factorial works by initializing a variable `fact` to 1, which will store the final result. Then, a loop starts from 1 and iterates up to the input number `n`. In each iteration, the current number `i` is multiplied with the `fact` variable, effectively calculating the factorial. This process involves [[Loop_Unrolling]] is not applied here, as we are iterating over each number. The multiplication operation follows the [[Operator_Precedence]] rules. The loop uses a [[Stack_Frame]] to store the local variables.

# 3. Edge Cases & Failure States
The iterative factorial function can overflow for large input values of `n`, since the result can exceed the maximum limit of an `unsigned long`. For example, `factorial(21)` will overflow because `21!` is larger than the maximum value that can be stored in an `unsigned long`. This is related to [[Integer_Overflow]] and [[Arithmetic_Underflow]]. Additionally, the function does not handle cases where `n` is 0 or negative; by definition, the factorial of 0 is 1, and for negative numbers, it's undefined. The function assumes that the input `n` is a non-negative integer, and it does not perform any [[Error Handling]].
# 4. Implementation Mechanics
```python
def iterative_factorial(n):
    fact = 1
    for i in range(1, n + 1):
        fact *= i
    return fact
```
This code snippet demonstrates the iterative approach to calculating the factorial of a given number `n`. The loop iterates from 1 to `n` (inclusive), multiplying the `fact` variable by each number in the range.

To read this code: The function `iterative_factorial(n)` takes an integer `n` as input and initializes a variable `fact` to 1. It then uses a for loop to iterate over the range from 1 to `n`, multiplying `fact` by each number `i` in the range.

## 5. Walkthrough
Let's calculate the factorial of 4 using the iterative approach:

1. Initialize `fact` to 1.
2. Start the loop with `i = 1`. Multiply `fact` (1) by `i` (1), so `fact` becomes 1.
3. In the next iteration, `i = 2`. Multiply `fact` (1) by `i` (2), so `fact` becomes 2.
4. In the next iteration, `i = 3`. Multiply `fact` (2) by `i` (3), so `fact` becomes 6.
5. In the final iteration, `i = 4`. Multiply `fact` (6) by `i` (4), so `fact` becomes 24.

The final result is `fact = 24`, which is the factorial of 4.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The iterative factorial of a number n is calculated by initializing a variable fact to [[Blank1]] and then multiplying it by each number from 1 to n.",
    "textWithBlanks": "The iterative factorial of a number n is calculated by initializing a variable fact to [[Blank1]] and then multiplying it by each number from 1 to n.",
    "answer": [
      "1"
    ],
    "explanation": "The iterative factorial is initialized with fact set to 1, which is the multiplicative identity."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "The iterative factorial function can handle negative input values.",
    "answer": "False",
    "explanation": "The factorial is undefined for negative numbers, and the function does not perform error handling for such cases."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code.",
    "content": "def iterative_factorial(n):\n  fact = 0\n  for i in range(1, n + 1):\n    fact *= i\n  return fact",
    "answer": "The bug is that the variable 'fact' is initialized to 0 instead of 1. This causes the result to always be 0.",
    "explanation": "The multiplicative identity is 1, not 0. Initializing 'fact' to 0 causes the entire product to be 0."
  }
]
```