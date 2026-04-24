---
title: Factorial
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
- "[[Functions]]"
---

# 1. Technical Definition
The `factorial` of a non-negative integer `n`, denoted as `n!`, is the product of all positive integers less than or equal to `n`. By definition, `0! = 1`, serving as the multiplicative identity for the `factorial` operation.

# 2. Syntax Mechanics
* The `factorial` function takes an integer `n` as input and returns the product of all positive integers from `1` to `n`.
* The `factorial` operation is typically denoted using the `postfix` notation, i.e., `n!`.
* The `factorial` function can be expressed recursively as `n! = n * (n-1)!`, with the base case being `0! = 1`.
* The `factorial` function grows rapidly, with the result exceeding the maximum limit of most programming languages' integer data types for relatively small values of `n`.

# 3. Memory Lifecycle
* The recursive implementation of the `factorial` function requires stack space proportional to the input value `n`, which can lead to a stack overflow for large values of `n`.
* The iterative implementation of the `factorial` function requires a constant amount of memory, making it more memory-efficient for large values of `n`.
* The `factorial` function has a time complexity of `O(n)`, making it computationally expensive for large values of `n`.
* The `factorial` function can be optimized using memoization or dynamic programming techniques to store and reuse previously computed results.

---

## 4. Worked Example

```cpp
#include <iostream>
#include <stdexcept>

/**
 * Calculates the factorial of a non-negative integer n.
 *
 * @param n A non-negative integer.
 * @return The factorial of n.
 */
unsigned long long factorial(int n) {
    if (n < 0) {
        throw std::invalid_argument("Input must be a non-negative integer.");
    }

    unsigned long long result = 1;
    for (int i = 1; i <= n; ++i) {
        result *= i;
    }

    return result;
}

int main() {
    try {
        int n;
        std::cout << "Enter a non-negative integer: ";
        std::cin >> n;
        std::cout << "Factorial of " << n << ": " << factorial(n) << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    return 0;
}
```

---

## 5. Knowledge Check

```interactive-quiz
[
  {
    "id": "q1",
    "type": "scenario",
    "difficulty": "L1",
    "question": "A user attempts to calculate the factorial of -1. What should the program do?",
    "answer": "Throw an exception indicating that the input must be a non-negative integer.",
    "explanation": "The factorial operation is only defined for non-negative integers. The program should handle this case by throwing an exception."
  },
  {
    "id": "q2",
    "type": "mcq",
    "difficulty": "L2",
    "question": "What is the time complexity of the iterative factorial function?",
    "options": {
      "A": "O(1)",
      "B": "O(log n)",
      "C": "O(n)",
      "D": "O(n^2)"
    },
    "answer": "C",
    "explanation": "The iterative factorial function has a time complexity of O(n) because it involves a single loop that runs from 1 to n."
  },
  {
    "id": "q3",
    "type": "code",
    "difficulty": "L3",
    "question": "Implement a recursive factorial function with memoization to store and reuse previously computed results.",
    "codeSnippet": "unsigned long long factorial(int n, std::unordered_map<int, unsigned long long>& memo) {\n    // ...\n}",
    "answer": "unsigned long long factorial(int n, std::unordered_map<int, unsigned long long>& memo) {\n    if (n < 0) {\n        throw std::invalid_argument(\"Input must be a non-negative integer.\");\n    }\n    if (n == 0 || n == 1) {\n        return 1;\n    }\n    if (memo.find(n) != memo.end()) {\n        return memo[n];\n    }\n    unsigned long long result = n * factorial(n - 1, memo);\n    memo[n] = result;\n    return result;\n}",
    "explanation": "The recursive factorial function with memoization stores previously computed results in a map to avoid redundant calculations."
  }
]
```