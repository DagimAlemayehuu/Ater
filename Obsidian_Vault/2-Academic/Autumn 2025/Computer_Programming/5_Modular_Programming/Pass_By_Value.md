---
title: Pass by Value
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
- "[[Variables]]"
---

# 1. Technical Definition
Pass by Value is a `parameter passing mechanism` where a copy of the original value is passed to a function, and any modifications made to the parameter within the function do not affect the original value. The `actual parameter` and `formal parameter` have separate memory locations.

# 2. Mental Model
Imagine you have a toy box with a certain number of blocks in it. When you pass the toy box to a friend, but instead of giving them the actual box, you make a copy of the box with the same number of blocks and give them the copy. If they add or remove blocks from their copy, it won't change the number of blocks in your original toy box.

# 3. Syntax Mechanics
* The actual parameter's value is copied and passed to the function.
* The formal parameter receives the copied value.
* Modifications to the formal parameter do not affect the actual parameter.
* The changes made to the formal parameter are lost when the function returns.

# 4. Memory Lifecycle
* A separate memory location is allocated for the formal parameter.
* The formal parameter's memory location is deallocated when the function returns.
* The actual parameter's value remains unchanged throughout the function call.
* The copy of the value passed to the function is discarded when the function returns.

---

## 5. Worked Example

```cpp
#include <iostream>

void modifyValue(int x) {
    x = 20; // Modifying the formal parameter
    std::cout << "Inside function: " << x << std::endl;
}

int main() {
    int originalValue = 10; // Actual parameter
    std::cout << "Before function call: " << originalValue << std::endl;
    modifyValue(originalValue);
    std::cout << "After function call: " << originalValue << std::endl;
    return 0;
}
```

### Execution Walkthrough
1. The `main` function initializes a variable `originalValue` with the value `10`.
2. The `modifyValue` function is called with `originalValue` as the actual parameter. A copy of `originalValue` (which is `10`) is passed to the function and stored in the formal parameter `x`.
3. Inside the `modifyValue` function, the formal parameter `x` is modified to `20`. This change does not affect the `originalValue` in the `main` function.
4. The `modifyValue` function prints the value of `x` (which is `20`) and returns.
5. The `main` function prints the value of `originalValue` after the function call, which remains `10`.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the value of the actual parameter after a function call using pass by value if the formal parameter is modified within the function?

**Implementation Challenge**: Write a C++ function that demonstrates pass by value by taking an integer as a parameter, incrementing it, and then printing the modified value within the function. Show how the original variable outside the function remains unchanged.

**Debug Challenge**: Find the memory leak/bug in the given code block.

---

### Answer Key
- L1_SCENARIO: The value of the actual parameter remains unchanged.
- L2_IMPLEMENTATION: The provided artifact demonstrates this concept.
- L3_DEBUG: There is no memory leak or bug in the given code block; it correctly demonstrates pass by value.