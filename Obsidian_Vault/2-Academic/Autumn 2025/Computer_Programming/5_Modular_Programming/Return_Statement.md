---
title: Return Statement
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
- "[[Function Definition]]"
---

# 1. Technical Definition
The `return` statement is a control flow statement that terminates the execution of a function and returns control to the caller, optionally providing a value through the `expression` parameter. The `return` statement consists of the `return` keyword followed by an optional `expression`, which is evaluated and returned to the caller.

# 2. Syntax Mechanics
* The `return` statement can be used with or without an `expression`, depending on the return type of the function.
* If a function is declared with a non-`void` return type, a `return` statement with an `expression` must be used to provide a value to the caller.
* The `expression` is evaluated and its value is returned to the caller, taking into account any applicable type conversions or promotions.
* A `return` statement can be used to exit a function prematurely, before the end of the function body is reached.

# 3. Memory Lifecycle
* The `return` statement does not affect the memory allocation or deallocation of local variables, which are automatically destroyed when the function returns.
* The `return` statement can affect the memory lifecycle of dynamically allocated memory, as the returned value may be a pointer to dynamically allocated memory.
* If a function returns a pointer to dynamically allocated memory, the caller is responsible for managing the memory lifecycle of the returned pointer.
* A `return` statement with an `expression` can cause a temporary object to be created, which is destroyed when the full expression is evaluated.

---

## 4. Worked Example

```cpp
// C++ example illustrating the use of the return statement
#include <iostream>

int add(int a, int b) {
    // Return statement with an expression
    return a + b;
}

void printMessage() {
    // Return statement without an expression
    std::cout << "Hello, World!" << std::endl;
    return;
}

int main() {
    int result = add(5, 10);
    std::cout << "Result: " << result << std::endl;

    printMessage();

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
    "question": "A function is declared with a non-void return type. What must be used to provide a value to the caller?",
    "answer": "A return statement with an expression",
    "explanation": "According to the syntax mechanics, if a function is declared with a non-void return type, a return statement with an expression must be used to provide a value to the caller."
  },
  {
    "id": "q2",
    "type": "code",
    "difficulty": "L2",
    "question": "What is the output of the following code snippet?",
    "codeSnippet": "int foo() { int x = 5; return x; } int main() { int result = foo(); std::cout << result << std::endl; return 0; }",
    "answer": "5",
    "explanation": "The code snippet defines a function foo() that returns an integer value 5. In the main() function, the result of foo() is printed to the console, which outputs 5."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how the return statement affects the memory lifecycle of local variables and dynamically allocated memory.",
    "answer": "The return statement does not affect the memory allocation or deallocation of local variables, which are automatically destroyed when the function returns. However, the return statement can affect the memory lifecycle of dynamically allocated memory, as the returned value may be a pointer to dynamically allocated memory. If a function returns a pointer to dynamically allocated memory, the caller is responsible for managing the memory lifecycle of the returned pointer.",
    "explanation": "This requires an understanding of memory management in C++ and how the return statement interacts with local variables and dynamically allocated memory."
  }
]
```