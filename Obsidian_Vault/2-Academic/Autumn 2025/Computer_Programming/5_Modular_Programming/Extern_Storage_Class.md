---
title: Extern Storage Class
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
- "[[Storage Class]]"
---

# 1. Technical Definition
The `extern` storage class specifier indicates that the variable or function can be accessed from other translation units, and its definition can appear in another file. The `extern` keyword allows for the declaration of a variable or function without defining it, enabling multiple source files to share the same variable or function.

# 2. Syntax Mechanics
* The `extern` keyword can be used to declare a variable or function without defining it, allowing for multiple definitions across translation units.
* When used with a function, `extern` implies the function can be accessed from other translation units.
* When used with a variable, `extern` implies the variable can be accessed from other translation units, and its definition must appear in exactly one translation unit.
* The `extern` keyword can be combined with the `C` linkage specifier to control the linkage of the declared entity.

# 3. Memory Lifecycle
* The `extern` storage class does not affect the memory allocation or deallocation of the variable or function.
* A variable declared with `extern` has a global lifetime, meaning it exists for the duration of the program.
* The definition of an `extern` variable or function must appear in a translation unit, and its initialization is subject to the rules of static initialization.
* An `extern` variable or function can have internal linkage if it is declared with the `static` keyword, restricting its accessibility to the current translation unit.

---

## 4. Worked Example

```cpp
// example.cpp
#include <iostream>

// extern variable declaration
extern int globalVar;

// extern function declaration
extern void externFunc();

int main() {
    // use the extern variable and function
    std::cout << "Global Var: " << globalVar << std::endl;
    externFunc();
    return 0;
}
```

```cpp
// example2.cpp
// definition of extern variable
int globalVar = 10;

// definition of extern function
void externFunc() {
    std::cout << "Extern Function Called" << std::endl;
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
    "question": "What is the primary purpose of the `extern` storage class specifier in C++?",
    "options": {
      "A": "To declare a variable or function without defining it, enabling access from other translation units.",
      "B": "To define a variable or function that can only be accessed within the current translation unit.",
      "C": "To dynamically allocate memory for a variable.",
      "D": "To specify the memory layout of a struct."
    },
    "answer": "A",
    "explanation": "The `extern` keyword allows for the declaration of a variable or function without defining it, enabling multiple source files to share the same variable or function."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "When using `extern` with a variable, its definition must appear in _______.",
    "textWithBlanks": "When used with a variable, `extern` implies the variable can be accessed from other translation units, and its definition must appear in exactly one [[Blank]].",
    "answer": ["translation unit"],
    "explanation": "The definition of an `extern` variable must appear in exactly one translation unit."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how the `extern` keyword interacts with the `static` keyword in terms of linkage and accessibility.",
    "answer": "When an `extern` variable or function is declared with the `static` keyword, it restricts its accessibility to the current translation unit, effectively giving it internal linkage. This means that even though the variable or function can be accessed throughout the program, its definition is only visible within the current translation unit, and it cannot be accessed from other translation units."
  }
]
```