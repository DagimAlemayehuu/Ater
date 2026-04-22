---
title: Automatic Variables
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 29
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Storage Class]]"
---

# 1. Technical Definition
Automatic variables are variables that are `automatically` allocated and deallocated memory space when a function is called and returned, respectively. They are also known as `local` or `auto` variables, and their scope is limited to the block in which they are defined.

# 2. Mental Model
Imagine you have a toy box that appears only when you're playing with a specific toy, and it disappears when you're done playing. Automatic variables are like that toy box - they only exist while a specific part of the program (like a function) is being used, and then they vanish.

# 3. Syntax Mechanics
* Automatic variables are declared within a function or block using the `auto` keyword, although it is often omitted.
* They are initialized with a value when declared, but can be changed within the block.
* Their scope is limited to the block in which they are defined, meaning they cannot be accessed outside that block.
* They are created when the block is executed and destroyed when the block is exited.

# 4. Memory Lifecycle
* Automatic variables have a limited lifetime, existing only while the block is being executed.
* They are stored on the `stack`, which means their memory is allocated and deallocated quickly.
* There is no need to manually deallocate memory for automatic variables, as it is handled automatically.
* If a function is called recursively, each call creates a new set of automatic variables, which are destroyed when the function returns.

---

## 5. Worked Example

```cpp
#include <iostream>

void exampleFunction() {
    auto intVar = 10;  // Automatic variable
    std::cout << "Inside exampleFunction: " << intVar << std::endl;
}

int main() {
    exampleFunction();
    // Trying to access intVar here would result in a compilation error
    // std::cout << intVar << std::endl;  // Uncommenting this line would cause a compilation error
    return 0;
}
```

### Execution Walkthrough
1. The program starts executing the `main` function.
2. The `exampleFunction` is called from `main`.
3. Inside `exampleFunction`, an automatic variable `intVar` is created and initialized with the value `10`.
4. The value of `intVar` is printed to the console.
5. `exampleFunction` returns, and `intVar` is automatically deallocated.
6. The program continues executing in `main`, but it does not attempt to access `intVar` because it is out of scope.

---

## 6. Socratic Probes

**Scenario-Based Question**: What type of variable is automatically allocated and deallocated memory space when a function is called and returned?

**Implementation Challenge**: Write a function that uses an automatic variable to count the number of times it is called.

**Debug Challenge**: Find the memory leak/bug in the following code block:
```cpp
void buggyFunction() {
    int* ptr = new int;
    *ptr = 10;
    // No delete statement
}
```

---

### Answer Key
- L1_SCENARIO: An automatic variable.
- L2_IMPLEMENTATION: 
```cpp
int count = 0;  // Not an automatic variable, but used to demonstrate

void countCalls() {
    auto callCount = 0;  // This is an automatic variable
    callCount++;
    std::cout << "Function called " << callCount << " time(s)." << std::endl;
    count++;  // Demonstrating a non-automatic variable
}

int main() {
    for(int i = 0; i < 5; i++) {
        countCalls();
    }
    return 0;
}
```
However, note that due to the nature of automatic variables, the count will always be 1 per function call. A static variable would be more suitable for a persistent count.

- L3_DEBUG: The bug in the code block is a memory leak. The `buggyFunction` dynamically allocates memory for an integer using `new`, but it never deallocates that memory using `delete`. This means that every time `buggyFunction` is called, it leaks memory. The fix is to add `delete ptr;` at the end of `buggyFunction`. However, using smart pointers or automatic variables would be a better practice.