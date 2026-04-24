---
title: Function Definition
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
- "[[Function Prototype]]"
---

# 1. Technical Definition
A `function definition` is a block of code that declares a named `function` with a specified set of `formal parameters`, allowing it to accept input and return output through a defined interface. The `function definition` serves as a template for creating `function instances`, which can be invoked with actual arguments to produce a result.

# 2. Syntax Mechanics
* A `function definition` typically consists of a `function keyword`, followed by a `function name`, a list of `formal parameters` enclosed in parentheses, and a `function body` enclosed in curly brackets.
* The `function body` contains a sequence of `statements` that are executed when the `function instance` is invoked.
* `Formal parameters` are placeholders for actual arguments passed to the `function instance`, and their scope is limited to the `function body`.
* The `function definition` may also include a `return type` specification, which defines the data type of the output produced by the `function instance`.

# 3. Memory Lifecycle
* A `function definition` is stored in memory as a `function object`, which contains metadata such as the `function name`, `formal parameters`, and `function body`.
* The `function object` is created during the compilation or interpretation phase, and its lifetime is tied to the scope of the surrounding program.
* When a `function instance` is invoked, a new `stack frame` is created to store local variables and parameters, which is discarded when the `function instance` returns.
* The `function definition` itself remains in memory until it is no longer referenced or the program terminates.

---

## 4. Worked Example

```cpp
#include <iostream>
#include <string>

// Function definition with formal parameters and return type
std::string greet(const std::string& name) {
    // Function body containing statements
    std::string message = "Hello, " + name + "!";
    return message;
}

int main() {
    // Create a function instance with actual arguments
    std::string result = greet("World");
    std::cout << result << std::endl;
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
    "question": "A function definition is a block of code that declares a named function with a specified set of formal parameters.",
    "answer": "True",
    "explanation": "This statement is true by definition of a function definition in programming."
  },
  {
    "id": "q2",
    "type": "debug",
    "difficulty": "L2",
    "question": "Identify the components of the following function definition: `int add(int a, int b) { return a + b; }`",
    "content": "int add(int a, int b) { return a + b; }",
    "answer": "The components are: function keyword (int), function name (add), formal parameters (int a, int b), and function body ({ return a + b; }).",
    "explanation": "Breaking down the function definition into its constituent parts."
  },
  {
    "id": "q3",
    "type": "scenario",
    "difficulty": "L3",
    "question": "Consider a program with a function definition that takes a string as input and returns a string as output. What happens to the memory allocated for the function object and the stack frame when the function instance is invoked and returns?",
    "answer": "The function object is created during compilation and remains in memory until the program terminates. When a function instance is invoked, a new stack frame is created to store local variables and parameters. The stack frame is discarded when the function instance returns.",
    "explanation": "Understanding the memory lifecycle of function definitions and instances."
  }
]
```