---
title: Global Variables
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
- "[[Scope Of Identifier]]"
---

# 1. Technical Definition
In the context of programming, a `global variable` is a variable that is defined outside of a function or class and is accessible from any part of the program, whereas a `local variable` is defined within a function or class and has limited scope. The `scope` of a global variable is the entire program, making it a shared resource among all functions and classes.

# 2. Syntax Mechanics
* Global variables are typically declared at the top of a source file or in a separate header file, making them accessible to all parts of the program through `extern` linkage.
* In languages with explicit `global` keywords, such as `global var` in some dialects, the variable's scope is explicitly defined as global.
* Global variables can be modified using `assignment` statements, and their values can be accessed using the variable's `identifier`.
* The `storage class` of a global variable is usually `static` or `extern`, determining its visibility and linkage.

# 3. Memory Lifecycle
* Global variables are allocated memory during program initialization, before the `main` function is executed, and persist until the program terminates.
* The lifetime of a global variable is the entire program execution, making it a `static storage duration` variable.
* Global variables can have limitations due to issues like `namespace pollution` and `name clashes`, which can lead to unexpected behavior or compilation errors.
* The accessibility of global variables can make it challenging to track changes to their values, potentially leading to difficulties in program debugging and maintenance.

---

## 4. Worked Example

```cpp
#include <iostream>

int globalVar = 10; // Global variable

void myFunction() {
    int localVar = 20; // Local variable
    std::cout << "Global Variable: " << globalVar << std::endl;
    std::cout << "Local Variable: " << localVar << std::endl;
}

int main() {
    myFunction();
    std::cout << "Global Variable outside function: " << globalVar << std::endl;
    // std::cout << localVar << std::endl; // Error: localVar is not accessible here
    return 0;
}
```

---

## 5. Knowledge Check

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the primary characteristic of a global variable in programming?",
    "options": {
      "A": "Defined within a function or class",
      "B": "Accessible from any part of the program",
      "C": "Has limited scope",
      "D": "Allocated memory during runtime"
    },
    "answer": "B",
    "explanation": "A global variable is defined outside of a function or class and is accessible from any part of the program."
  },
  {
    "id": "q2",
    "type": "writing",
    "difficulty": "L2",
    "question": "Explain the differences between global and local variables in terms of scope, accessibility, and memory allocation.",
    "answer": "Global variables are defined outside of a function or class, have a global scope, and are accessible from any part of the program. They are allocated memory during program initialization and persist until the program terminates. Local variables, on the other hand, are defined within a function or class, have a limited scope, and are only accessible within that function or class. They are allocated memory when the function or class is executed and deallocated when the function or class terminates.",
    "explanation": "The key differences between global and local variables lie in their scope, accessibility, and memory allocation. Global variables have a global scope, making them accessible from anywhere in the program, whereas local variables have a limited scope and are only accessible within their defined function or class. In terms of memory allocation, global variables are allocated memory during program initialization and persist until the program terminates, whereas local variables are allocated memory when their function or class is executed and deallocated when it terminates."
  },
  {
    "id": "q3",
    "type": "fill_in",
    "difficulty": "L3",
    "question": "Fill in the blanks: Global variables have a storage class of either [[Blank1]] or [[Blank2]], and their lifetime is characterized by [[Blank3]] storage duration.",
    "textWithBlanks": "Global variables have a storage class of either [[Blank1]] or [[Blank2]], and their lifetime is characterized by [[Blank3]] storage duration.",
    "answer": ["static", "extern", "static"],
    "explanation": "Global variables can have a storage class of either static or extern, which determines their visibility and linkage. Their lifetime is characterized by static storage duration, meaning they are allocated memory during program initialization and persist until the program terminates."
  }
]
```