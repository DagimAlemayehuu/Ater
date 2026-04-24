---
title: Assignment Operator
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
The assignment operator `=` is a binary operator that assigns the value of the right operand to the left operand, modifying the left operand's value. The assignment operator has a return value, which is the assigned value, allowing for assignments to be used in expressions.

# 2. Mental Model
Imagine you have a labeled box where you can store a value. The assignment operator is like taking a value from another box and putting it into your labeled box, replacing whatever was there before. 

# 3. Syntax Mechanics
* The left operand must be a variable, a reference, or a memory location.
* The right operand can be any valid expression that produces a value.
* The assignment operator can be used to assign values of various data types, including `int`, `float`, and `string`.
* Chaining assignments is allowed, e.g., `a = b = 5;`.

# 4. Memory Lifecycle
* The assigned value is stored in the memory location associated with the left operand.
* The left operand's previous value is overwritten, potentially leading to memory leaks if not handled properly.
* There is no limit to the number of assignments that can be made to a variable.
* The data type of the assigned value must be compatible with the data type of the left operand.

---

## 5. Worked Example

```cpp
#include <iostream>
#include <string>

int main() {
    int a = 5;
    int b = 10;

    // Chaining assignments
    a = b = 20;

    std::cout << "a = " << a << std::endl;
    std::cout << "b = " << b << std::endl;

    // Assigning different data types
    double c = 30.5;
    int d;
    d = c;  // Implicit conversion

    std::cout << "c = " << c << std::endl;
    std::cout << "d = " << d << std::endl;

    return 0;
}
```

### Execution Walkthrough
1. Initialize `a` with the value `5` and `b` with the value `10`.
2. The statement `a = b = 20;` first assigns `20` to `b` and then assigns the result (`20`) to `a`. Both `a` and `b` end up with the value `20`.
3. The program then assigns `30.5` to `c` and implicitly converts it to an integer when assigning to `d`, truncating the decimal part.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the value of `a` after executing the statement `a = 10;` if `a` was initially `5`?

**Implementation Challenge**: Write a C++ code snippet that demonstrates chaining assignments for three variables `x`, `y`, and `z`, all of type `int`, to the value `15`.

**Debug Challenge**: Find the memory leak/bug in the following code snippet: `int* ptr = new int; *ptr = 10; ptr = new int; *ptr = 20;` and suggest a fix.

---

### Answer Key
- L1_SCENARIO: `10`.
- L2_IMPLEMENTATION: ```cpp
int main() {
    int x, y, z;
    x = y = z = 15;
    std::cout << "x = " << x << ", y = " << y << ", z = " << z << std::endl;
    return 0;
}
```
- L3_DEBUG: The bug is a memory leak. The code allocates memory for an `int` with `new int`, assigns `10` to it, but then immediately allocates new memory for another `int` without deleting the previously allocated memory, causing the first `int`'s memory to leak. 
  - Fix: `int* ptr = new int; *ptr = 10; delete ptr; ptr = new int; *ptr = 20;` or better yet, use smart pointers or containers to manage memory automatically.


```