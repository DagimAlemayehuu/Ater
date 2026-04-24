---
title: Ambiguous Overloading
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
- "[[Function Overloading]]"
---

# 1. Technical Definition
Ambiguous overloading occurs when multiple `function signatures` are compatible with a given `function call`, resulting in a compiler error due to the inability to uniquely resolve the intended `overload`. This arises from the presence of multiple functions with identical `parameter lists` or `function parameter` types that can be implicitly converted to match the provided arguments.

# 2. Syntax Mechanics
* The resolution of overloaded functions relies on the `function signature`, which comprises the `function name` and `parameter list`, but not the `return type`.
* `Function overloading` allows multiple functions with the same name to be defined, provided their `parameter lists` differ in terms of `parameter types` or `parameter count`.
* The `overload resolution` process involves comparing the types of the provided arguments against the `parameter types` of each candidate function to determine the best match.
* If multiple functions are viable candidates, the overload is considered ambiguous, and a compiler error is generated.

# 3. Memory Lifecycle
* The memory layout of overloaded functions does not differ, as the `function signature` solely determines the entry point.
* The compiler performs `overload resolution` at compile-time, without impacting runtime memory allocation.
* Ambiguous overloading does not affect memory safety, as it is a compile-time error.
* The presence of ambiguous overloading does not influence the `memory footprint` of the program, as no code is generated for unresolved overloads.

---

## 4. Worked Example

```cpp
#include <iostream>

// Example of function overloading
void print(int value) {
    std::cout << "Printing int: " << value << std::endl;
}

void print(double value) {
    std::cout << "Printing double: " << value << std::endl;
}

// Example of ambiguous overloading
void ambiguousOverload(int a, int b) {
    std::cout << "Ambiguous Overload: int, int" << std::endl;
}

void ambiguousOverload(double a, double b) {
    std::cout << "Ambiguous Overload: double, double" << std::endl;
}

int main() {
    print(10);       // Unambiguous
    print(10.5);     // Unambiguous

    // ambiguousOverload(10, 20.5); // Compiler Error: Ambiguous
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
    "question": "Ambiguous overloading occurs when multiple function signatures are incompatible with a given function call.",
    "answer": "False",
    "explanation": "Ambiguous overloading occurs when multiple function signatures are compatible with a given function call, making it impossible for the compiler to uniquely resolve the intended overload."
  },
  {
    "id": "q2",
    "type": "code",
    "difficulty": "L2",
    "question": "What is the output of the following code snippet?",
    "codeSnippet": "void foo(int a) { std::cout << \"int\" << std::endl; }\\nvoid foo(double a) { std::cout << \"double\" << std::endl; }\\nint main() { foo(10); return 0; }",
    "answer": "int",
    "explanation": "The output is 'int' because the function call foo(10) matches the parameter type of the first function foo(int a)."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code snippet and explain how to resolve it.",
    "content": "void process(int a, double b);\\nvoid process(double a, int b);\\nint main() { process(10, 20); return 0; }",
    "answer": "The bug is that the function call process(10, 20) is ambiguous because both function signatures can match the provided arguments through implicit conversions.",
    "explanation": "To resolve the bug, you can either provide more specific arguments to make the function call unambiguous or modify the function signatures to avoid overloading. For example, you can change one of the function names or modify the parameter types to be more distinct."
  }
]
```