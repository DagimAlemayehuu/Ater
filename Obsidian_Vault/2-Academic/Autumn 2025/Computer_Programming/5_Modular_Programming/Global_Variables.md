---
title: Global Variables
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 21
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Identifier Scope]]"
---

# 1. Technical Definition
In programming, a **global variable** is a variable that is defined outside of any function or class and is accessible from anywhere in the program, with a `global scope` that encompasses all functions and modules. Global variables are often stored in a `global namespace`, which can lead to naming conflicts if not managed properly.

# 2. Mental Model
Imagine a big bulletin board in a school hallway where everyone can post and read notes. A global variable is like a note on this bulletin board that can be seen and used by anyone, anywhere in the school, without needing to be given to them personally.

# 3. Syntax Mechanics
* Global variables are typically declared outside of any function or class.
* They can be accessed from any part of the program.
* In some languages, global variables are implicitly `public` and can be modified by any part of the program.
* Global variables can be used to share data between different functions or modules.

# 4. Memory Lifecycle
* Global variables are allocated memory when the program starts.
* They remain in memory until the program terminates.
* Global variables can lead to memory leaks if not properly cleaned up.
* Changes to global variables can have unintended consequences in other parts of the program.

---

## 5. Worked Example

```cpp
#include <iostream>

int globalVariable = 10; // Global variable

void function1() {
    std::cout << "Global variable in function1: " << globalVariable << std::endl;
    globalVariable = 20; // Modifying the global variable
}

void function2() {
    std::cout << "Global variable in function2: " << globalVariable << std::endl;
}

int main() {
    std::cout << "Initial global variable: " << globalVariable << std::endl;
    function1();
    function2();
    return 0;
}
```

### Execution Walkthrough
1. The program starts and memory is allocated for the global variable `globalVariable` with an initial value of 10.
2. In the `main` function, the initial value of `globalVariable` is printed, which is 10.
3. `function1` is called, which prints the current value of `globalVariable` (10), modifies it to 20, and then returns.
4. `function2` is called, which prints the modified value of `globalVariable` (20).

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the initial value of the global variable `globalVariable` in the provided C++ code?

**Implementation Challenge**: How can you use a global variable to share data between two functions in a C++ program, and what are the potential risks?

**Debug Challenge**: Find the memory leak/bug: Assume the global variable `globalVariable` is a pointer to an integer, and it is dynamically allocated but never deallocated. How would you identify and fix this issue?

---

### Answer Key
- **L1_SCENARIO:** The initial value of the global variable `globalVariable` is 10.
- **L2_IMPLEMENTATION:** A global variable can be used to share data between two functions by declaring it outside of any function. However, potential risks include naming conflicts, unintended modifications, and difficulties in tracking changes.
- **L3_DEBUG:** If `globalVariable` is a pointer to an integer that is dynamically allocated but never deallocated, it would cause a memory leak. This can be identified by using memory debugging tools or by manually tracking memory allocations. To fix this, you would need to add `delete` to deallocate the memory when it is no longer needed, ideally before the program terminates. For example:
```cpp
int* globalVariable = new int(10); // Dynamically allocate memory

// ...

delete globalVariable; // Deallocate memory before program termination
```