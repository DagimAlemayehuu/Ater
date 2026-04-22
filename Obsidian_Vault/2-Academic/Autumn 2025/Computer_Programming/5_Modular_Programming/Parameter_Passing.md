---
title: Parameter Passing
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 39
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Empty Parameter Lists]]"
---

# 1. Technical Definition
Parameter passing is a mechanism used in programming to pass arguments to a function or procedure, allowing the function to access and manipulate the passed values. The `formal parameters` of a function are matched with the `actual parameters` (or `arguments`) provided during the function call, enabling the function to operate on the passed data.

# 2. Mental Model
Imagine you're ordering food at a restaurant. You tell the waiter what you want (like a burger and fries), and they take your order to the kitchen. The kitchen staff (the function) then prepares your food based on your order (the arguments). They don't need to know how you want it (like extra sauce), just what you ordered. 

# 3. Syntax Mechanics
* Parameters can be passed by `value`, where a copy of the argument is made and passed to the function.
* Parameters can be passed by `reference`, where the memory address of the argument is passed to the function, allowing the function to modify the original value.
* Some languages support `pass-by-name`, where the argument is evaluated only when its value is actually needed within the function.
* Function signatures define the number, types, and order of parameters a function expects.

# 4. Memory Lifecycle
* When passing by value, a new memory allocation is made for the parameter, and changes within the function do not affect the original argument.
* When passing by reference, the function operates on the same memory location as the original argument, so changes within the function affect the original value.
* There is typically a limit to the number of parameters a function can accept, which varies by programming language and its syntax.
* Parameter passing mechanisms can impact performance, especially when dealing with large data structures or complex objects.

---

## 5. Worked Example

```cpp
#include <iostream>

void passByValue(int x) {
    x = 20;
    std::cout << "Inside passByValue: " << x << std::endl;
}

void passByReference(int& x) {
    x = 30;
    std::cout << "Inside passByReference: " << x << std::endl;
}

int main() {
    int value = 10;
    std::cout << "Original value: " << value << std::endl;
    passByValue(value);
    std::cout << "Value after passByValue: " << value << std::endl;
    passByReference(value);
    std::cout << "Value after passByReference: " << value << std::endl;
    return 0;
}
```

### Execution Walkthrough
1. The program starts with a `main` function that declares an integer `value` initialized to 10.
2. It prints the original value of `value`, which is 10.
3. The function `passByValue` is called with `value` as an argument. Inside `passByValue`, the local copy of `x` is modified to 20, and the new value is printed.
4. After returning from `passByValue`, the program prints the value of `value` again, which remains 10, demonstrating that changes made within `passByValue` did not affect the original `value`.
5. The function `passByReference` is called with `value` as an argument. Inside `passByReference`, the reference to `x` (which is `value`) is modified to 30, and the new value is printed.
6. After returning from `passByReference`, the program prints the value of `value` again, which is now 30, demonstrating that changes made within `passByReference` affected the original `value`.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary difference between passing parameters by value and by reference in C++?

**Implementation Challenge**: Suppose you want to implement a function that swaps the values of two integers. Which parameter passing mechanism would you use and why?

**Debug Challenge**: In the provided code, what would happen if you tried to pass a literal value (e.g., 10) to the `passByReference` function? How would you fix it?

---

### Answer Key
- L1_SCENARIO: The primary difference is that passing by value creates a local copy of the argument, changes to which do not affect the original value, whereas passing by reference allows the function to modify the original value directly.
- L2_IMPLEMENTATION: You would use pass-by-reference because it allows the function to modify the original values of the two integers, effectively swapping them.
- L3_DEBUG: If you tried to pass a literal value to `passByReference`, the compiler would error because it cannot take a reference to a non-existent variable. To fix it, you would either pass a variable, use a pointer and dynamic memory allocation, or change the function to accept const references or pointers. For example, you could modify the function to accept a pointer: `void passByReference(int* x) { *x = 30; }` and call it with `passByReference(&value);`.