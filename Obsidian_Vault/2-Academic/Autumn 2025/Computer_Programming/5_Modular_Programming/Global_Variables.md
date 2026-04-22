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
- "[[Local Variables]]"
---

# 1. Technical Definition
In programming, a **global variable** is a variable that is defined outside of any function or class and is accessible from any part of the program, with `global scope` implying that it can be accessed and modified by any function. A global variable is typically declared at the top of a source file or in a separate module, and its `scope` is not limited to a specific block or function.

# 2. Mental Model
Imagine a big box in the middle of a school where everyone can put and take things. This box is like a global variable, and anyone in the school (or program) can access it and change what's inside. Just like how students need to be careful what they put in or take from the box, programmers need to be careful with global variables because they can affect the whole program.

# 3. Syntax Mechanics
* Global variables are typically declared outside of any function or class.
* They can be accessed and modified by any function in the program.
* In some languages, the `global` keyword is used to declare a global variable, while in others, it is implied by the variable's position in the code.
* Global variables can be used to share data between different parts of a program.

# 4. Memory Lifecycle
* Global variables are allocated memory when the program starts and remain in memory until the program ends.
* They can lead to memory leaks if not properly cleaned up, as they continue to occupy memory even when not in use.
* Global variables can be changed by any function, which can lead to unexpected behavior if not properly synchronized.
* Some programming languages have limitations on the number of global variables that can be defined or have specific rules for their usage.

---

## 5. Worked Example

```cpp
#include <iostream>

int globalVar = 10; // Global variable

void function1() {
    std::cout << "Global variable in function1: " << globalVar << std::endl;
    globalVar = 20; // Modifying the global variable
}

void function2() {
    std::cout << "Global variable in function2: " << globalVar << std::endl;
}

int main() {
    std::cout << "Initial global variable: " << globalVar << std::endl;
    function1();
    function2();
    return 0;
}
```

### Execution Walkthrough
1. The program starts and the global variable `globalVar` is initialized to 10.
2. In the `main` function, the initial value of `globalVar` is printed, which is 10.
3. `function1` is called, which prints the current value of `globalVar` (10), modifies it to 20, and then returns.
4. `function2` is called, which prints the current value of `globalVar` (20), as modified by `function1`.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the initial value of the global variable `globalVar` in the provided C++ code?

**Implementation Challenge**: How can you use a global variable to share data between different functions in a C++ program, considering the example given?

**Debug Challenge**: Find the memory leak/bug: In the given code, there is no obvious memory leak because the global variable does not dynamically allocate memory. However, what could be a potential issue if the global variable were to be dynamically allocated and not properly deallocated?

---

### Answer Key
- L1_SCENARIO: The initial value of the global variable `globalVar` is 10.
- L2_IMPLEMENTATION: You can use a global variable to share data between different functions by declaring it outside of any function, as shown in the example. Any function can access and modify it.
- L3_DEBUG: A potential issue could arise if the global variable were dynamically allocated (e.g., using `new`) and not properly deallocated (e.g., using `delete`), leading to a memory leak. However, in the given code, `globalVar` is statically allocated, so this is not a concern.