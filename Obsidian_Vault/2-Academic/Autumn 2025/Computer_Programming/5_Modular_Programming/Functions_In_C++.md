---
title: Functions in C++
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
- "[[Modules]]"
---

# 1. Technical Definition
In C++, a `function` is a block of code that can be called multiple times from different parts of a program, and is defined using the `function_definition` syntax, which includes a `return_type`, `function_name`, and `parameter_list`. A function can take zero or more `parameters`, and can return a value of a specific `return_type`, which can be any valid C++ `type`.

# 2. Syntax Mechanics
* A function definition consists of a `return_type`, `function_name`, and `parameter_list`, followed by a function body enclosed in curly brackets `{}`.
* The `parameter_list` is a comma-separated list of `parameter_declarations`, each consisting of a `type` and a `parameter_name`.
* Functions can be declared using a `function_declaration`, which specifies the `return_type`, `function_name`, and `parameter_list`, but does not include a function body.
* Functions can be overloaded, allowing multiple functions with the same `function_name` to be defined, as long as they have different `parameter_list`s.

# 3. Memory Lifecycle
* When a function is called, a new `stack_frame` is created, which contains the function's `local_variables` and `parameters`.
* The `stack_frame` is destroyed when the function returns, which means that any `local_variables` declared within the function are no longer accessible after the function returns.
* Functions can take `references` or `pointers` as parameters, which allows them to modify the original variables passed to them.
* Recursive function calls can lead to a `stack_overflow` if the function calls itself too many times, exceeding the maximum allowed `stack_size`.

---

## 4. Worked Example

```cpp
#include <iostream>
#include <string>

// Function declaration
int addNumbers(int a, int b);

// Function definition
int addNumbers(int a, int b) {
    return a + b;
}

// Function with reference parameter
void swapNumbers(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

// Overloaded functions
int max(int a, int b) {
    return (a > b) ? a : b;
}

std::string max(const std::string& a, const std::string& b) {
    return (a > b) ? a : b;
}

int main() {
    int result = addNumbers(5, 10);
    std::cout << "Result: " << result << std::endl;

    int x = 5;
    int y = 10;
    swapNumbers(x, y);
    std::cout << "Swapped: " << x << ", " << y << std::endl;

    int maxInt = max(10, 20);
    std::cout << "Max Int: " << maxInt << std::endl;

    std::string maxStr = max("hello", "world");
    std::cout << "Max Str: " << maxStr << std::endl;

    return 0;
}
```

---

## 5. Knowledge Check

```interactive-quiz
[
  {
    "id": "q1",
    "type": "writing",
    "difficulty": "L1",
    "question": "Describe the basic components of a C++ function definition.",
    "answer": "A C++ function definition consists of a return type, function name, and parameter list, followed by a function body enclosed in curly brackets {}.",
    "explanation": "The return type specifies the data type of the value returned by the function. The function name is the identifier used to call the function. The parameter list is a comma-separated list of parameter declarations, each consisting of a type and a parameter name."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "Can multiple functions with the same name be defined in C++ as long as they have different return types?",
    "answer": "False",
    "explanation": "In C++, functions can be overloaded, allowing multiple functions with the same name to be defined, but they must have different parameter lists, not just different return types."
  },
  {
    "id": "q3",
    "type": "fill_in",
    "difficulty": "L3",
    "question": "When a function is called, a new [[Blank1]] is created on the [[Blank2]], which contains the function's local variables and parameters.",
    "answer": ["stack frame", "call stack"],
    "explanation": "When a function is called, a new stack frame is created on the call stack, which contains the function's local variables and parameters. This stack frame is destroyed when the function returns."
  }
]
```