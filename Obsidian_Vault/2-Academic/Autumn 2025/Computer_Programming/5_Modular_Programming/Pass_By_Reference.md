---
title: Pass by Reference
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 45
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Call By Reference]]"
---

# 1. Technical Definition
Pass by reference is a method of passing arguments to a function where the `memory address` of the original variable is passed, allowing the function to modify the original variable's value directly. This means that any changes made to the variable within the function affect the original variable outside the function.

# 2. Mental Model
Imagine you have a map that shows the location of your house. If you give this map to someone, they can find your house and make changes to it, like putting up a new fence. You would see the new fence when you look at your house because the map led them to the actual house, not just a copy of it.

# 3. Syntax Mechanics
* The function receives a reference to the original variable.
* Changes made to the variable within the function affect the original variable.
* The function can modify the original variable's value directly.
* The `memory address` of the original variable is passed to the function.

# 4. Memory Lifecycle
* The original variable's value can be changed permanently.
* The function has direct access to the original variable's memory location.
* Changes made by the function are reflected outside the function.
* The original variable's memory location remains the same throughout the process.

---

## 5. Worked Example

```cpp
#include <iostream>

void swapByReference(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int x = 5;
    int y = 10;

    std::cout << "Before swap: x = " << x << ", y = " << y << std::endl;
    swapByReference(x, y);
    std::cout << "After swap: x = " << x << ", y = " << y << std::endl;

    return 0;
}
```

### Execution Walkthrough
1. The `main` function initializes two integer variables, `x` and `y`, with values 5 and 10, respectively.
2. The `swapByReference` function is called with `x` and `y` as arguments, passing their memory addresses to the function.
3. Within the `swapByReference` function, the values of `a` and `b` (which are references to `x` and `y`) are swapped using a temporary variable.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary mechanism by which a function can modify the original variable's value when using pass by reference in C++?

**Implementation Challenge**: Suppose you have a function that needs to swap the values of two integer variables. How would you implement this using pass by reference in C++?

**Debug Challenge**: In the provided code, what would happen if the `swapByReference` function was modified to accept the arguments by value instead of by reference, and how would the output change?

---

### Answer Key
- L1_SCENARIO: The primary mechanism is that the function receives a reference to the original variable, allowing it to modify the original variable's value directly.
- L2_IMPLEMENTATION: You would implement it by defining a function that takes two integer references as parameters and swapping their values within the function, as shown in the provided `swapByReference` function.
- L3_DEBUG: If the `swapByReference` function was modified to accept the arguments by value, the changes made to the variables within the function would not affect the original variables outside the function. The output would show that the values of `x` and `y` remain unchanged after the function call.