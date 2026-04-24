---
title: Static Variables
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
A `static variable` is a type of variable that retains its value across multiple function calls, and its lifetime spans the entire duration of the program. In `object-oriented programming`, a `static variable` is shared by all instances of a class, and changes made by one instance affect all others.

# 2. Syntax Mechanics
* The `static` keyword is used to declare a `static variable` within a class or function.
* `Static variables` are initialized only once, at program startup, and retain their values until the program terminates.
* Access to `static variables` is typically achieved using the class name or instance name, depending on the programming language's syntax.
* `Static variables` can be used to implement `singleton patterns` or `global variables` with restricted access.

# 3. Memory Lifecycle
* `Static variables` are stored in a program's `data segment`, which is a part of the program's memory layout.
* The lifetime of a `static variable` is tied to the program's execution, meaning it is allocated memory at program startup and deallocated at program termination.
* Changes to `static variables` can affect program behavior and performance, particularly in multi-threaded environments.
* Access to `static variables` can be restricted using `access modifiers`, such as `private` or `protected`, to control visibility and modification.

---

## 4. Worked Example

```cpp
#include <iostream>

class StaticExample {
public:
    static int staticVar;

    StaticExample() {
        staticVar++;
    }

    static int getStaticVar() {
        return staticVar;
    }
};

int StaticExample::staticVar = 0;

int main() {
    std::cout << StaticExample::getStaticVar() << std::endl; // Outputs: 0

    StaticExample instance1;
    std::cout << StaticExample::getStaticVar() << std::endl; // Outputs: 1

    StaticExample instance2;
    std::cout << StaticExample::getStaticVar() << std::endl; // Outputs: 2

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
    "question": "A static variable in C++ retains its value across multiple function calls.",
    "answer": "True",
    "explanation": "Static variables in C++ are initialized only once and retain their values until the program terminates."
  },
  {
    "id": "q2",
    "type": "mcq",
    "difficulty": "L2",
    "question": "How is a static variable typically accessed in C++?",
    "options": {
      "A": "Using the instance name only",
      "B": "Using the class name or instance name",
      "C": "Using a pointer to the variable",
      "D": "Using a reference to the variable"
    },
    "answer": "B",
    "explanation": "In C++, static variables can be accessed using either the class name or an instance of the class."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how static variables are stored in memory and how their lifetime affects program behavior, particularly in multi-threaded environments.",
    "answer": "Static variables in C++ are stored in the program's data segment. Their lifetime spans the entire program execution, meaning they are allocated at program startup and deallocated at program termination. This can affect program behavior and performance in multi-threaded environments, as changes to static variables can have global implications. Access to static variables can be restricted using access modifiers like private or protected to control visibility and modification.",
    "explanation": "The explanation should cover the storage, lifetime, and implications of static variables in C++."
  }
]
```