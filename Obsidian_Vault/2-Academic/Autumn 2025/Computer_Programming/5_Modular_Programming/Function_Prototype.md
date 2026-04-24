---
title: Function Prototype
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
- "[[Function Declaration]]"
---

# 1. Technical Definition
A `function prototype` is a declaration of a function that specifies its `name`, `return type`, and `parameter list`, serving as a template for function definitions and enabling `type checking` and `overloading resolution`. The `function prototype` is also known as a `function signature` or `function declaration`.

# 2. Syntax Mechanics
* A `function prototype` consists of a `function name`, `return type`, and `parameter list`, which are used to identify the function and its expected inputs and outputs.
* The `parameter list` is a comma-separated list of `parameter declarations`, each consisting of a `type` and a `name`.
* The `return type` specifies the data type of the value returned by the function, which can be any valid `type` in the programming language.
* `Function prototypes` can be overloaded, allowing multiple functions with the same `name` to be defined, as long as they have distinct `parameter lists`.

# 3. Memory Lifecycle
* The `function prototype` does not allocate memory for the function itself, but rather serves as a declaration that can be used to generate a `function definition`.
* The `function prototype` is typically stored in the program's `symbol table`, which is used for `type checking` and `overloading resolution`.
* When a `function definition` is compiled, the `function prototype` is used to verify that the definition matches the declared `function signature`.
* The `function prototype` does not have a runtime memory footprint, as it is solely a compile-time construct used for type checking and function resolution.

---

## 4. Worked Example

```cpp
// Function prototype (or function declaration)
int addNumbers(int a, int b);

// Function definition
int addNumbers(int a, int b) {
    return a + b;
}

// Function prototype with default argument values
int greet(const std::string& name = "World");

// Function definition with default argument values
int greet(const std::string& name) {
    std::cout << "Hello, " << name << std::endl;
    return 0;
}

// Overloaded function prototypes
int calculateArea(int width, int height);
double calculateArea(double radius);

int main() {
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
    "question": "A function prototype is a declaration of a function that specifies its name, return type, and parameter list.",
    "answer": "True",
    "explanation": "A function prototype, also known as a function signature or function declaration, serves as a template for function definitions and enables type checking and overloading resolution."
  },
  {
    "id": "q2",
    "type": "writing",
    "difficulty": "L2",
    "question": "Explain the purpose of a function prototype in C++ and how it is used for type checking and overloading resolution.",
    "answer": "A function prototype in C++ serves as a declaration of a function that specifies its name, return type, and parameter list. It enables type checking by ensuring that the function definition matches the declared function signature. Additionally, function prototypes allow for overloading resolution by enabling multiple functions with the same name to be defined, as long as they have distinct parameter lists.",
    "explanation": "The function prototype is used by the compiler to verify that the function definition matches the declared function signature, and to resolve overloaded functions."
  },
  {
    "id": "q3",
    "type": "mcq",
    "difficulty": "L3",
    "question": "What is the primary purpose of a function prototype in C++?",
    "options": {
      "A": "To allocate memory for the function",
      "B": "To specify the function's name, return type, and parameter list",
      "C": "To define the function's implementation",
      "D": "To resolve runtime errors"
    },
    "answer": "B",
    "explanation": "The primary purpose of a function prototype in C++ is to specify the function's name, return type, and parameter list, which enables type checking and overloading resolution."
  }
]
```