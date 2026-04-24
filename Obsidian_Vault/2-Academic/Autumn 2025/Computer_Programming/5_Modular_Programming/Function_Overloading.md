---
title: Function Overloading
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
Function overloading is a form of `static polymorphism` that allows multiple functions with the same `identifier` to be defined, as long as they have different `parameter lists`. This enables the compiler to resolve the correct function to invoke based on the number and types of arguments passed.

# 2. Syntax Mechanics
* Function overloading is achieved through the use of `function signatures`, which comprise the `function name` and `parameter list`.
* The `parameter list` is used to distinguish between overloaded functions, allowing for multiple functions with the same `identifier` to coexist.
* Overloaded functions must have different `parameter lists`, which can be achieved through variations in `parameter types`, `parameter counts`, or both.
* The `function resolution` process is performed at compile-time, allowing the compiler to select the correct overloaded function based on the provided arguments.

# 3. Memory Lifecycle
* Function overloading does not affect the `memory layout` of the program, as the memory allocation for each function is determined by the `linker`.
* The `compiler` must ensure that the correct function is invoked, taking into account the `parameter list` and `function signature`.
* Overloaded functions share the same `namespace`, which can lead to naming conflicts if not managed properly.
* The `one-definition rule` still applies to overloaded functions, requiring that each function have a unique definition.

---

## 4. Worked Example

```cpp
#include <iostream>

// Overloaded functions with different parameter lists
int add(int a, int b) {
    return a + b;
}

double add(double a, double b) {
    return a + b;
}

int main() {
    int result1 = add(5, 10);      // Calls int add(int, int)
    double result2 = add(5.5, 10.5); // Calls double add(double, double)

    std::cout << "Result 1: " << result1 << std::endl;
    std::cout << "Result 2: " << result2 << std::endl;

    return 0;
}
```

---

## 5. Knowledge Check

```interactive-quiz
[
  {
    "id": "q1",
    "type": "code",
    "difficulty": "L1",
    "question": "What is the output of the following code snippet?",
    "codeSnippet": "int add(int a, int b) { return a + b; }\ndouble add(double a, double b) { return a + b; }\nint main() { return add(5, 10); }",
    "answer": "15",
    "explanation": "The code snippet defines two overloaded functions, 'add(int, int)' and 'add(double, double)'. The 'main' function calls 'add(5, 10)', which matches the 'add(int, int)' function, returning 15."
  },
  {
    "id": "q2",
    "type": "debug",
    "difficulty": "L2",
    "question": "Identify the issue in the following code snippet.",
    "content": "int add(int a, int b) { return a + b; }\nint add(int a, int b, int c) { return a + b + c; }\nint main() { return add(5, 10); }",
    "answer": "The issue is that the second 'add' function is not considered an overload of the first 'add' function because it has a different number of parameters, but the call in 'main' does not match either function.",
    "explanation": "The code attempts to overload 'add' with a different number of parameters. However, the call 'add(5, 10)' does not provide enough arguments to match the second 'add' function, leading to a compilation error due to ambiguity."
  },
  {
    "id": "q3",
    "type": "mcq",
    "difficulty": "L3",
    "question": "What is a key characteristic of function overloading in C++?",
    "options": {
      "A": "Multiple functions with the same identifier can coexist if they have different return types.",
      "B": "Multiple functions with the same identifier can coexist if they have different parameter lists.",
      "C": "Multiple functions with the same identifier can coexist if they are in different namespaces.",
      "D": "Multiple functions with the same identifier can coexist if they are defined in different files."
    },
    "answer": "B",
    "explanation": "Function overloading in C++ allows multiple functions with the same identifier to coexist if they have different parameter lists. This enables the compiler to resolve which function to invoke based on the number and types of arguments passed."
  }
]
```