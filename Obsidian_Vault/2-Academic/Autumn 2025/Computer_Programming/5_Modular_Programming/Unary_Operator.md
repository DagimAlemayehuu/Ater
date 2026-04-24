---
title: Unary Operator
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
A unary operator is an `operator` that takes only one `operand` to produce a result, such as the `increment` operator (++) or the `dereference` operator (*). In programming, unary operators are used to perform operations on a single value, like `negation` (-expr) or `bitwise complement` (~expr).

# 2. Mental Model
Imagine you have a single box where you can put a value. A unary operator is like a special button that takes the value in the box and changes it in some way, but it doesn't need a second box to work with. For example, if you have a box with the number 5 in it, a unary operator like "negation" would change the value in the box to -5.

# 3. Syntax Mechanics
* Unary operators precede their operand, like `!expr` or `-value`.
* They can be used to modify or transform the operand, such as incrementing or decrementing a value.
* Unary operators have higher precedence than binary operators, so expressions like `a = -b + c` are evaluated correctly.
* Some unary operators, like `sizeof`, are used to obtain information about the operand.

# 4. Memory Lifecycle
* Unary operators do not allocate or deallocate memory; they only operate on existing values.
* The result of a unary operator is typically stored in a register or assigned to a variable.
* Unary operators can have side effects, such as modifying the operand, but this depends on the specific operator.
* The scope and lifetime of the operand are not affected by the unary operator itself.

---

## 5. Worked Example

```cpp
#include <iostream>

int main() {
    int x = 5;
    int y = -x;  // Using unary negation operator
    int z = ~x;  // Using bitwise complement operator

    std::cout << "Original value: " << x << std::endl;
    std::cout << "Negation: " << y << std::endl;
    std::cout << "Bitwise Complement: " << z << std::endl;

    return 0;
}
```

### Execution Walkthrough
1. The program starts by including the necessary `iostream` header for input/output operations.
2. In the `main` function, an integer `x` is initialized with the value 5.
3. The unary negation operator `-` is applied to `x` and the result is stored in `y`. This changes the sign of `x`.
4. The bitwise complement operator `~` is applied to `x` and the result is stored in `z`. This flips all the bits of `x`.
5. The original value of `x`, its negation `y`, and its bitwise complement `z` are printed to the console.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the result of applying the unary negation operator to the value 5?

**Implementation Challenge**: Suppose you have a variable `int temperature = 25;` and you want to express its opposite (e.g., -25) using a unary operator. How would you do it?

**Debug Challenge**: Find the memory leak/bug in the given code block.

---

### Answer Key
- L1_SCENARIO: The result of applying the unary negation operator to the value 5 is -5.
- L2_IMPLEMENTATION: You can express the opposite of `temperature` by using the unary negation operator like this: `int oppositeTemperature = -temperature;`.
- L3_DEBUG: There is no memory leak in the given code block. It properly allocates and deallocates memory (if needed) and does not exhibit any memory-related issues. The code is straightforward and does not contain any bugs related to memory management.