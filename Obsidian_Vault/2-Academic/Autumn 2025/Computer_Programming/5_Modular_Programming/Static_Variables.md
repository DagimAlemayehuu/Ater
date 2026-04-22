---
title: Static Variables
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 30
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Automatic Variables]]"
---

# 1. Technical Definition
A `static` variable in programming is a variable that retains its value between function calls, and its lifetime spans the entire program execution. The `static` keyword is used to declare a variable that is initialized only once, and its value persists until the program terminates.

# 2. Mental Model
Imagine you have a notebook where you write down a piece of information, and you want to keep that information forever, even if you close the notebook and come back to it later. A static variable is like that notebook page - once you write something on it, it stays there until you erase it, and it remembers what you wrote even when you're not looking at it.

# 3. Syntax Mechanics
* Static variables are declared using the `static` keyword.
* They are initialized only once, at program startup.
* Static variables can be used within functions or outside functions, but within a single file.
* Static variables have a fixed memory location.

# 4. Memory Lifecycle
* Static variables are allocated memory only once, at program startup.
* They retain their values until the program terminates.
* Static variables do not have a limited scope like automatic variables do.
* There can be only one instance of a static variable in a program.

---

## 5. Worked Example

```cpp
#include <iostream>

void incrementCounter() {
    static int counter = 0;
    counter++;
    std::cout << "Counter: " << counter << std::endl;
}

int main() {
    incrementCounter();  // Outputs: Counter: 1
    incrementCounter();  // Outputs: Counter: 2
    incrementCounter();  // Outputs: Counter: 3
    return 0;
}
```

### Execution Walkthrough
1. The program starts, and the `main` function is called.
2. Within `main`, `incrementCounter` is called for the first time. The static variable `counter` is initialized to 0, then incremented to 1, and its value is printed.
3. `incrementCounter` is called again. Since `counter` is static, its previous value (1) is retained, it is incremented to 2, and its new value is printed.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary characteristic of a static variable in C++?

**Implementation Challenge**: How would you use a static variable to keep track of the number of times a function is called in a C++ program?

**Debug Challenge**: Find the memory leak/bug in the following code and explain how it relates to static variables:
```cpp
#include <iostream>

void createArray() {
    static int* arr = new int[10];
    // Use arr
}

int main() {
    for (int i = 0; i < 10; i++) {
        createArray();
    }
    return 0;
}
```

---

### Answer Key
- **L1_SCENARIO:** A static variable in C++ retains its value between function calls and has a lifetime that spans the entire program execution.
- **L2_IMPLEMENTATION:** A static variable can be used inside a function to keep track of the number of times the function is called by initializing it once and incrementing it each time the function is called.
- **L3_DEBUG:** The memory leak in the given code is that it dynamically allocates an array of 10 integers every time `createArray` is called, but it never deallocates this memory. Since the pointer `arr` is static, it retains its value (the memory address) between calls, but the memory itself is not released, leading to a memory leak. This can be fixed by ensuring the memory is deallocated when it's no longer needed or by using smart pointers.