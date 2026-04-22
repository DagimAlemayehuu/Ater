---
title: External Storage Class
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 32
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Static Variables]]"
---

# 1. Technical Definition
The `extern` storage class specifier indicates that the variable or function is defined elsewhere in the program, and its definition can be found in another source file. The `extern` storage class is used to declare a variable or function that is defined outside the current file, allowing it to be accessed from multiple files.

# 2. Mental Model
Imagine you have a toy box in your room, but your friend has a similar toy box in their room. You can tell your friend about your toy box, and they can use the toys from it, even if they can't see it. The `extern` keyword is like telling your friend about your toy box, so they can use the things inside it.

# 3. Syntax Mechanics
* The `extern` keyword is used to declare a variable or function that is defined elsewhere.
* The declaration must match the definition of the variable or function.
* The `extern` keyword can be used with or without an initializer.
* Multiple files can have an `extern` declaration for the same variable or function.

# 4. Memory Lifecycle
* The memory for an `extern` variable is allocated in the file where it is defined, not where it is declared.
* The linker resolves references to `extern` variables and functions across multiple files.
* There can be only one definition of an `extern` variable or function across all files.
* If an `extern` variable is not initialized, it must be defined elsewhere with an initializer.

---

## 5. Worked Example

```cpp
// file1.cpp
int globalVar = 10;

// file2.cpp
extern int globalVar;

int main() {
    globalVar = 20;
    return 0;
}
```

### Execution Walkthrough
1. The program starts execution from `main()` in `file2.cpp`.
2. The `extern` declaration in `file2.cpp` tells the compiler that `globalVar` is defined elsewhere.
3. The linker resolves the reference to `globalVar` and finds its definition in `file1.cpp`.
4. The program executes `globalVar = 20;`, modifying the value of `globalVar` defined in `file1.cpp`.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the purpose of the `extern` storage class specifier in C++?

**Implementation Challenge**: Suppose we have a large program with multiple source files, and we want to share a global constant across all files. How can we use the `extern` keyword to achieve this?

**Debug Challenge**: Find the memory leak/bug in the following code:
```cpp
// file1.cpp
int* globalPtr;

// file2.cpp
extern int* globalPtr;

int main() {
    globalPtr = new int;
    *globalPtr = 10;
    return 0;
}
```

---

### Answer Key
* L1_SCENARIO: The `extern` storage class specifier is used to declare a variable or function that is defined outside the current file, allowing it to be accessed from multiple files.
* L2_IMPLEMENTATION: We can declare the global constant with `extern` in a header file, and define it in one of the source files. For example:
// global_constants.h
extern const int GLOBAL_CONSTANT;

// file1.cpp
const int GLOBAL_CONSTANT = 10;

// other_file.cpp
#include "global_constants.h"
int main() {
    // use GLOBAL_CONSTANT
    return 0;
}
* L3_DEBUG: The bug is a memory leak. The memory allocated for `globalPtr` is never deleted. To fix this, we should add `delete globalPtr;` before the program exits. Alternatively, we can use smart pointers to manage the memory automatically.