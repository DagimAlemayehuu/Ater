---
title: Base Case
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
- "[[Recursion]]"
---

# 1. Technical Definition
The `base case` is a fundamental concept in recursive functions, defined as a trivial case that provides a stopping criterion for the recursion, allowing the function to terminate. In essence, the `base case` is a condition that, when met, returns a direct result, bypassing further recursive calls.

# 2. Syntax Mechanics
* The `base case` is typically defined as a conditional statement that checks for a specific condition, such as an empty input or a minimum value.
* When the `base case` condition is met, the function returns a pre-defined value or result, effectively terminating the recursion.
* The `base case` serves as a boundary condition, ensuring that the recursive function converges to a solution.
* A well-defined `base case` is essential to prevent infinite recursion and ensure the function's correctness.

# 3. Memory Lifecycle
* A poorly defined `base case` can lead to a stack overflow error, as the function continues to recurse without terminating.
* The `base case` determines the maximum recursion depth, which is limited by the available stack memory.
* In recursive functions, the `base case` helps to conserve memory by avoiding unnecessary recursive calls.
* A correct implementation of the `base case` ensures that the function's memory usage remains bounded and predictable.

---

## 4. Worked Example

```cpp
#include <iostream>

// Recursive function to calculate the factorial of a number
int factorial(int n) {
    // Base case: factorial of 0 or 1 is 1
    if (n == 0 || n == 1) {
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
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The [[Base Case]] is a condition that, when met, returns a direct result, bypassing further [[Recursive Calls]].",
    "textWithBlanks": "The [[Base Case]] is a condition that, when met, returns a direct result, bypassing further [[Recursive Calls]].",
    "answer": ["base case", "recursive calls"],
    "explanation": "The base case is a fundamental concept in recursive functions that provides a stopping criterion for the recursion."
  },
  {
    "id": "q2",
    "type": "mcq",
    "difficulty": "L2",
    "question": "What is the primary purpose of the base case in a recursive function?",
    "options": {
      "A": "To perform the recursive calculation",
      "B": "To provide a stopping criterion for the recursion",
      "C": "To optimize the function's performance",
      "D": "To handle errors and exceptions"
    },
    "answer": "B",
    "explanation": "The base case provides a stopping criterion for the recursion, allowing the function to terminate."
  },
  {
    "id": "q3",
    "type": "code",
    "difficulty": "L3",
    "question": "Identify the bug in the following recursive function and correct it.",
    "codeSnippet": "int factorial(int n) {\n    if (n > 0) {\n        return n * factorial(n-1);\n    }\n}",
    "answer": "The bug is that the function is missing a base case. The corrected code is:\nint factorial(int n) {\n    if (n == 0 || n == 1) {\n        return 1;\n    } else {\n        return n * factorial(n-1);\n    }\n}",
    "explanation": "The function is missing a base case, which can lead to infinite recursion and a stack overflow error."
  }
]
```