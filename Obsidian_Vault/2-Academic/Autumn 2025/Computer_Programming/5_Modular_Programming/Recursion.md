---
title: Recursion
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages: []
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Functions]]"
---

# 1. Technical Definition
Recursion is a programming paradigm where a function invokes itself as a subroutine, allowing for the solution of a problem to be expressed in terms of smaller instances of the same problem, utilizing the concept of `base case` and `recursive case`. The recursive function solves a problem by breaking it down into smaller sub-problems of the same type, which are then solved by the same function, until the solution to the original problem is obtained through the composition of the solutions to the sub-problems.

# 2. Syntax Mechanics
* A recursive function consists of a `base case` that provides a termination condition, and a `recursive case` that breaks down the problem into smaller sub-problems.
* The `recursive case` involves a function call to itself, with a smaller input or a modified version of the original input.
* The function uses a `stack` data structure to store the function calls, allowing for the return to previous states and the composition of solutions.
* The recursive function must ensure that the `base case` is eventually reached, to prevent infinite recursion.

# 3. Memory Lifecycle
* Recursive functions are subject to a `stack overflow` limitation, where excessive recursion can exceed the maximum stack size, leading to a program crash.
* Each recursive function call adds a new layer to the `call stack`, which consumes memory and can lead to performance degradation.
* The `base case` serves as a threshold for terminating the recursion, allowing the function to return and free up memory on the `call stack`.
* The recursive function's memory usage is directly related to the depth of recursion, making it essential to optimize the function to minimize memory consumption.

---

## 4. Worked Example

```cpp
#include <iostream>

// Recursive function to calculate factorial
int factorial(int n) {
    // Base case: 1! = 1
    if (n == 1) {
        return 1;
    }
    // Recursive case: n! = n * (n-1)!
    else {
        return n * factorial(n-1);
    }
}

int main() {
    int num = 5;
    std::cout << "Factorial of " << num << " is: " << factorial(num) << std::endl;
    return 0;
}
```

---

## 5. Knowledge Check

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Recursion is a programming paradigm where a function invokes itself as a subroutine.",
    "answer": "True",
    "explanation": "Recursion is indeed a programming paradigm where a function invokes itself as a subroutine, allowing for the solution of a problem to be expressed in terms of smaller instances of the same problem."
  },
  {
    "id": "q2",
    "type": "debug",
    "difficulty": "L2",
    "question": "Identify the potential issue in the following recursive function: int factorial(int n) { if (n == 0) return 1; else return n * factorial(n-1); }",
    "content": "int factorial(int n) { if (n == 0) return 1; else return n * factorial(n-1); }",
    "answer": "The function does not handle the case where n is negative. Also, it does not check for stack overflow.",
    "explanation": "The given recursive function does not handle negative input values and does not have a check for stack overflow, which can lead to incorrect results or a program crash."
  },
  {
    "id": "q3",
    "type": "mcq",
    "difficulty": "L3",
    "question": "What is the primary limitation of recursive functions?",
    "options": {
      "A": "Infinite loops",
      "B": "Stack overflow",
      "C": "Memory leaks",
      "D": "Performance degradation"
    },
    "answer": "B",
    "explanation": "The primary limitation of recursive functions is the risk of stack overflow due to excessive recursion, which can exceed the maximum stack size and lead to a program crash."
  }
]
```