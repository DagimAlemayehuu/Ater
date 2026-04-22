---
title: Function Agreement
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 12
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Return Statement]]"
---

# 1. Technical Definition
A function agreement, also known as function matching, refers to the process of ensuring that the `function prototype`, `function definition`, and `function call` have matching `parameter lists`, `return types`, and `function names`. This agreement is crucial for the compiler to correctly resolve the function call and prevent errors.

# 2. Mental Model
Imagine you're ordering food at a restaurant. You tell the waiter what you want (function call), the waiter writes it down (function prototype), and the chef prepares it (function definition). For everything to work smoothly, the waiter, you, and the chef must all agree on what you're ordering, right? Similarly, in programming, the function prototype, definition, and call must agree on the details.

# 3. Syntax Mechanics
* The `function name` must be identical in the prototype, definition, and call.
* The `parameter list` must match exactly, including the number, types, and order of parameters.
* The `return type` must be the same in the prototype and definition.
* The `function call` must provide the correct number and types of arguments.

# 4. Memory Lifecycle
* A mismatch between the function prototype, definition, and call can lead to compiler errors or warnings.
* The compiler checks for function agreement during the compilation process, before any code is executed.
* If the function agreement is not met, the program may not compile or may produce unexpected behavior.
* Function agreement is only checked at compile-time, not at runtime.

---

## 5. Worked Example

```cpp
#include <iostream>

// Function prototype
int addNumbers(int a, int b);

int main() {
    int result = addNumbers(5, 10);
    std::cout << "Result: " << result << std::endl;
    return 0;
}

// Function definition
int addNumbers(int a, int b) {
    return a + b;
}
```

### Execution Walkthrough
1. The compiler encounters the function prototype `int addNumbers(int a, int b);` and stores it in the symbol table.
2. The compiler encounters the function call `addNumbers(5, 10)` in the `main()` function and checks if it matches the function prototype.
3. The compiler finds the function definition `int addNumbers(int a, int b) { return a + b; }` and checks if it matches the function prototype.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary purpose of function agreement in C++?

**Implementation Challenge**: Suppose you want to write a function called `calculateArea` that takes two `double` parameters and returns the area of a rectangle. Write a function prototype, a function call, and a function definition that demonstrate function agreement.

**Debug Challenge**: Find the bug in the following code snippet and explain how function agreement is violated:
```cpp
// Function prototype
void greet(std::string name);

// Function definition
int greet(std::string name) {
    std::cout << "Hello, " << name << std::endl;
    return 0;
}

// Function call
greet("John");
```

---

### Answer Key
* L1_SCENARIO: The primary purpose of function agreement in C++ is to ensure that the function prototype, function definition, and function call have matching parameter lists, return types, and function names.
* L2_IMPLEMENTATION:
```cpp
// Function prototype
double calculateArea(double length, double width);

// Function call
double area = calculateArea(5.0, 10.0);

// Function definition
double calculateArea(double length, double width) {
    return length * width;
}
```
* L3_DEBUG: The bug in the code snippet is that the return type of the function definition `int greet(std::string name)` does not match the return type of the function prototype `void greet(std::string name)`. The function agreement is violated because the function prototype and definition do not have the same return type. To fix the bug, the return type of the function definition should be changed to `void`. 
```cpp
// Function prototype
void greet(std::string name);

// Function definition
void greet(std::string name) {
    std::cout << "Hello, " << name << std::endl;
}
```