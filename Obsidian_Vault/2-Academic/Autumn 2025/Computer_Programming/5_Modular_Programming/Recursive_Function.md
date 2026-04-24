---
title: Recursive Function
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
- "[[Recursion]]"
---

# 1. Technical Definition
A `recursive function` is a `function` that invokes itself directly or indirectly, allowing it to be repeated several times, since it can call itself during its execution. The process of recursion has two main components: a `base case` that provides a termination condition and a `recursive case` that breaks down the problem into smaller sub-problems.

# 2. Syntax Mechanics
* A recursive function consists of a `base case` that provides a stopping condition, preventing infinite recursion.
* The `recursive case` breaks down the problem into smaller sub-problems, which are then solved by the same function.
* Each recursive call must make progress toward the `base case`, ensuring termination.
* The function uses a `stack` data structure to store the call stack, allowing it to manage the recursive calls.

# 3. Memory Lifecycle
* Recursive functions are subject to a `stack overflow` error if the recursion is too deep, exceeding the maximum allowed stack size.
* Each recursive call adds a new layer to the `call stack`, consuming memory.
* The `base case` serves as a threshold, determining when the recursion should terminate and memory can be released.
* The function's memory usage is directly related to the depth of recursion, making it essential to optimize recursive algorithms.

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
    "type": "debug",
    "difficulty": "L1",
    "question": "What is the primary purpose of the base case in a recursive function?",
    "content": "A recursive function consists of a base case that provides a stopping condition, preventing infinite recursion.",
    "answer": "To provide a termination condition",
    "explanation": "The base case serves as a threshold to stop the recursion, preventing a stack overflow error."
  },
  {
    "id": "q2",
    "type": "writing",
    "difficulty": "L2",
    "question": "Explain how a recursive function manages memory during execution.",
    "answer": "A recursive function uses a stack data structure to store the call stack, allowing it to manage the recursive calls. Each recursive call adds a new layer to the call stack, consuming memory. The base case serves as a threshold, determining when the recursion should terminate and memory can be released.",
    "explanation": "The function's memory usage is directly related to the depth of recursion, making it essential to optimize recursive algorithms."
  },
  {
    "id": "q3",
    "type": "mcq",
    "difficulty": "L3",
    "question": "What is a potential risk associated with recursive functions?",
    "options": {
      "A": "Data corruption",
      "B": "Stack overflow error",
      "C": "Infinite loop",
      "D": "Memory leak"
    },
    "answer": "B",
    "explanation": "Recursive functions are subject to a stack overflow error if the recursion is too deep, exceeding the maximum allowed stack size."
  }
]
```