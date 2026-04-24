---
title: Arithmetic Operators
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
prerequisites:
- "[[Operators]]"
---

# 1. Technical Definition
The `arithmetic operators` are a set of binary operators that take two operands and perform mathematical operations, including `addition`, `subtraction`, `multiplication`, and `division`, returning a numeric result. These operators are used to manipulate numeric values, and their operations are based on the standard mathematical rules, such as the order of operations.

# 2. Mental Model
Imagine you have a toy box with some toys inside, and you want to add or remove toys. Arithmetic operators are like special instructions that help you do math with numbers, like combining toys or taking some away. For example, if you have 3 toys and your friend gives you 2 more, you can use the `addition` operator to find out you now have 5 toys.

# 3. Syntax Mechanics
* The basic arithmetic operators are: `+` (addition), `-` (subtraction), `*` (multiplication), and `/` (division).
* These operators are binary, meaning they require two operands, such as `a + b`.
* The order of operations can be controlled using parentheses, like `(a + b) * c`.
* Arithmetic operators can be used with various data types, including integers and floating-point numbers.

# 4. Memory Lifecycle
* Arithmetic operations are performed directly on the operands, without storing intermediate results, unless explicitly assigned to a variable.
* The result of an arithmetic operation can be stored in a variable or used immediately in another operation.
* There are limitations to arithmetic operations, such as division by zero, which results in an error.
* The data type of the operands can affect the result, such as integer division truncating the decimal part.

---

## 5. Worked Example

```cpp
#include <iostream>

int main() {
    int a = 10;
    int b = 3;

    // Addition
    int sum = a + b;
    std::cout << "Sum: " << sum << std::endl;

    // Subtraction
    int difference = a - b;
    std::cout << "Difference: " << difference << std::endl;

    // Multiplication
    int product = a * b;
    std::cout << "Product: " << product << std::endl;

    // Division
    int quotient = a / b;
    std::cout << "Quotient: " << quotient << std::endl;

    return 0;
}
```

### Execution Walkthrough
1. The program starts by declaring two integer variables `a` and `b` and initializing them with values 10 and 3, respectively.
2. It then performs addition, subtraction, multiplication, and division operations on `a` and `b`, storing the results in `sum`, `difference`, `product`, and `quotient`, respectively.
3. Finally, it prints out the results of each operation.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the result of 10 + 3 in C++?

**Implementation Challenge**: Write a C++ program that calculates the area of a rectangle given its length and width using arithmetic operators.

**Debug Challenge**: Find the bug in the following code: `int result = 10 / 0;`

---

### Answer Key
- L1_SCENARIO: 13
- L2_IMPLEMENTATION: 
```cpp
int main() {
    int length = 5;
    int width = 3;
    int area = length * width;
    std::cout << "Area: " << area << std::endl;
    return 0;
}
```
- L3_DEBUG: The bug is a division by zero error. In C++, dividing by zero results in undefined behavior. To fix it, ensure the divisor is not zero before performing division.