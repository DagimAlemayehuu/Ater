---
title: Variables
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '2'
hub: "[[2_C++_Programming_Fundamentals_Hub]]"
source: "[[Chapter 2.Pdf]]"
source_pages:
- 22
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you have a labeled box where you can store a toy. The label on the box is like a name, and you can put a different toy in the box at any time. The box itself is like a special spot in your room where you can keep the toy. In programming, a variable is like this labeled box where you can store a value.

# 2. Execution Logic & Data Flow
When a variable is declared, the compiler or interpreter allocates a [[Memory_Address]] for it. The variable's name is then mapped to this memory address, allowing the program to store and retrieve values from it. During execution, the program can use the variable's name to access its [[Stack_Frame]] and retrieve the stored value. The value is then used in [[Operator_Precedence]] rules to evaluate expressions. When the variable's value is updated, the new value is stored at the same memory address.

# 3. Edge Cases & Failure States
When dealing with variables, edge cases arise when trying to access a variable before it's initialized, resulting in [[Undefined_Behavior]]. Another edge case occurs when a variable's scope is exceeded, causing it to go out of [[Variable_Scope]]. Additionally, variables can have [[Data_Type]] constraints that must be respected to avoid type-related errors. If a variable is not properly [[Memory_Allocation]], it can lead to memory leaks or crashes.
# 4. Implementation Mechanics
```cpp
#include <iostream>

int main() {
    int x = 5;  // declare and initialize variable x
    int y;      // declare variable y

    y = x;      // assign value of x to y

    std::cout << "x: " << x << std::endl;
    std::cout << "y: " << y << std::endl;

    x = 10;     // update value of x

    std::cout << "x: " << x << std::endl;
    std::cout << "y: " << y << std::endl;

    return 0;
}
```
This C++ code demonstrates the basics of variable declaration, initialization, assignment, and updating. The memory layout can be represented as:
```
  +---------------+
  |  Stack Frame  |
  +---------------+
  |  x  |  y  |
  |  5   |  5  |
  +---------------+
```
Initially, `x` and `y` are stored in memory with the value `5`. When `x` is updated to `10`, the memory layout changes to:
```
  +---------------+
  |  Stack Frame  |
  +---------------+
  |  x  |  y  |
  | 10   |  5  |
  +---------------+
```
The code shows how variables are stored in memory and how their values can be updated.

## 5. Walkthrough
Here's a step-by-step walkthrough of a scenario applying the concept of variables:

1. A program declares a variable `age` and initializes it with the value `25`.
2. The program then declares another variable `is_adult` and assigns it a value based on the condition `age >= 18`.
3. The program prints the value of `age` and `is_adult`.
4. The program updates the value of `age` to `30`.
5. The program re-evaluates the condition `age >= 18` and updates the value of `is_adult` accordingly.

Let's assume the initial values are:
- `age`: `$25$`
- `is_adult`: `true` (since `$25 \geq 18$`)

The program's output will be:
```
age: 25
is_adult: 1 (or true)
```
After updating `age` to `$30$`, the program re-evaluates the condition and updates `is_adult` to `true` (no change).

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "A variable's name is mapped to a [[Blank1]] where the program stores and retrieves values.",
    "textWithBlanks": "A variable's name is mapped to a [[Blank1]] where the program stores and retrieves values.",
    "answer": [
      "memory address"
    ],
    "explanation": "A variable's name is associated with a specific memory location."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "Variables can be accessed outside their declared scope.",
    "answer": "False",
    "explanation": "Variables are only accessible within their declared scope."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code.",
    "content": "int main() { int x; x = 5; std::cout << y << std::endl; return 0; }",
    "answer": "The bug is that the variable 'y' is not declared before use. The correct code should use 'x' instead of 'y'.",
    "explanation": "The variable 'y' is not declared, causing a compilation error."
  }
]
```