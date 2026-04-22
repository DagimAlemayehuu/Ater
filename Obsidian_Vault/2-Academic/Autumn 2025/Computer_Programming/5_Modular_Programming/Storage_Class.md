---
title: Storage Class
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 28
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Inline Functions]]"
---

# 1. Technical Definition
The `storage class` in C programming refers to the scope, linkage, and storage duration of a variable or function. It is specified using keywords such as `auto`, `register`, `static`, `extern`, and `typedef`.

# 2. Mental Model
Imagine you have a bunch of boxes where you can store your toys. The storage class is like a label on the box that decides who can play with the toy (scope), if it can be shared with friends (linkage), and how long the toy can stay in the box (storage duration).

# 3. Syntax Mechanics
* The `auto` keyword is used to declare a local variable that is automatically initialized and destroyed when the block is entered and exited.
* The `static` keyword is used to declare a variable that retains its value between function calls and has internal linkage.
* The `extern` keyword is used to declare a variable or function that is defined elsewhere and has external linkage.
* The `register` keyword is a hint to the compiler to store a variable in a register for faster access.

# 4. Memory Lifecycle
* Variables with `auto` storage class have a limited lifetime and are destroyed when the block is exited.
* Variables with `static` storage class have a lifetime that spans the entire program execution.
* Variables with `extern` storage class have a lifetime that is determined by their definition elsewhere in the program.
* Variables with `register` storage class have a lifetime that is similar to `auto`, but the compiler may optimize their storage.

---

## 5. Worked Example

```cpp
#include <iostream>

int main() {
    // auto storage class
    auto x = 10;
    std::cout << "Auto variable x: " << x << std::endl;

    // static storage class
    static int y = 20;
    std::cout << "Static variable y: " << y << std::endl;
    y = 30;
    std::cout << "Updated static variable y: " << y << std::endl;

    // extern storage class
    extern int z;
    std::cout << "Extern variable z: " << z << std::endl;

    // register storage class
    register int regVar = 40;
    std::cout << "Register variable regVar: " << regVar << std::endl;

    return 0;
}

int z = 50;  // definition of extern variable z
```

### Execution Walkthrough
1. The program starts executing from the `main` function.
2. The `auto` variable `x` is declared and initialized with the value `10`.
3. The `static` variable `y` is declared and initialized with the value `20`. 
4. The `extern` variable `z` is declared, but its definition is found elsewhere in the program.
5. The `register` variable `regVar` is declared and initialized with the value `40`.
6. The program prints the values of `x`, `y`, `z`, and `regVar` to the console.
7. The value of `y` is updated to `30` and printed again.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary purpose of the `auto` keyword in C++?

**Implementation Challenge**: Suppose you want to create a counter that retains its value between function calls. Which storage class would you use and why?

**Debug Challenge**: Find the memory leak/bug in the given code block.

---

### Answer Key
* L1_SCENARIO: The primary purpose of the `auto` keyword in C++ is to declare a local variable that is automatically initialized and destroyed when the block is entered and exited.
* L2_IMPLEMENTATION: You would use the `static` storage class to create a counter that retains its value between function calls, because `static` variables retain their values between function calls and have internal linkage.
* L3_DEBUG: There is no apparent memory leak in the given code block. However, the `register` keyword is just a hint to the compiler and does not guarantee that the variable will be stored in a register. The code seems to be correct in terms of memory management. 

However, if we consider another code with dynamic memory:

```cpp
int* createMemoryLeak() {
    int* ptr = new int;
    *ptr = 10;
    return ptr;
}

int main() {
    int* ptr = createMemoryLeak();
    // delete ptr; // memory leak if this line is commented out
    return 0;
}
```
In this case, L3_DEBUG: The bug is that the dynamically allocated memory is not being deallocated, resulting in a memory leak. The fix is to add `delete ptr;` in the `main` function.