---
title: Statements
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 2.Pdf]]"
source_pages: []
mode: CS-CODE
read: false
generated: true
---

# 1. Technical Definition
A C++ program is made up of one or more `statements`, which are the basic building blocks of a program, and are terminated by a semicolon `;`. Each statement in C++ is an instruction that the computer will execute, and can be a `declaration`, an `expression`, or a `control flow` statement.

# 2. Mental Model
Imagine you're writing a recipe for your favorite cake. Each line in the recipe is like a statement in a program - it's a single instruction that the computer (or the baker) will follow. Just like how you need to mix the ingredients, add sugar, and bake the cake, a program needs to execute each statement in order to achieve its goal.

# 3. Syntax Mechanics
* Statements are terminated by a semicolon `;`.
* A statement can be a `declaration`, such as `int x = 5;`.
* A statement can be an `expression`, such as `x = 5;`.
* A statement can be a `control flow` statement, such as `if (x > 5) { ... }`.

# 4. Memory Lifecycle
* Variables declared in a statement have a limited scope and lifetime.
* Statements can allocate memory using operators like `new` and `delete`.
* Statements can also deallocate memory, but must be careful to avoid memory leaks.
* The order of execution of statements can affect the memory lifecycle of variables and objects.

---

## 5. Worked Example

```cpp
#include <iostream>

int main() {
    int* ptr = new int;
    *ptr = 10;
    std::cout << *ptr << std::endl;
    delete ptr;
    // ptr is now a dangling pointer
    std::cout << *ptr << std::endl; // This will cause undefined behavior
    return 0;
}
```

### Execution Walkthrough
1. The program starts by dynamically allocating memory for an integer using `new int` and assigns the address to the pointer `ptr`.
2. The value `10` is assigned to the memory location pointed to by `ptr`.
3. The program prints the value stored at the memory location pointed to by `ptr`, which is `10`.
4. The program deallocates the memory using `delete ptr`.
5. The program then attempts to print the value stored at the memory location pointed to by `ptr` again, but `ptr` is now a dangling pointer because the memory it points to has been deallocated.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the purpose of the semicolon `;` in C++?

**Implementation Challenge**: Write a C++ program that demonstrates the use of declaration, expression, and control flow statements.

**Debug Challenge**: Identify the memory bug in the provided code block and explain how to fix it.

---

### Answer Key
* L1_SCENARIO: The semicolon `;` is used to terminate a statement in C++.
* L2_IMPLEMENTATION: 
```cpp
#include <iostream>

int main() {
    int x = 5; // declaration
    x = 10; // expression
    if (x > 5) { // control flow statement
        std::cout << "x is greater than 5" << std::endl;
    }
    return 0;
}
```
* L3_DEBUG: The memory bug in the provided code block is the use of a dangling pointer `ptr` after it has been deallocated. To fix it, we should not access the memory location pointed to by `ptr` after it has been deallocated. The corrected code would be:
```cpp
#include <iostream>

int main() {
    int* ptr = new int;
    *ptr = 10;
    std::cout << *ptr << std::endl;
    delete ptr;
    ptr = nullptr; // set ptr to nullptr to prevent dangling pointer
    // do not access *ptr here
    return 0;
}
```