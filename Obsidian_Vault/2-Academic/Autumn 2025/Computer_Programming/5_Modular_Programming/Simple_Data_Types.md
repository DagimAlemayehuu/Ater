---
title: Simple Data Types
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
- "[[Data Types]]"
---

# 1. Technical Definition
Simple data types are `primitive data types` that are built into a programming language and represent a single value, such as a number, character, or boolean. They are the basic building blocks of more complex data types and are used to store and manipulate individual values.

# 2. Mental Model
Imagine you have a box where you can store a single piece of information, like a toy. Just like how you can put a toy in a box, simple data types are like boxes that can hold a single value, like a number or a letter.

# 3. Syntax Mechanics
* Simple data types are typically defined using keywords such as `int`, `float`, `char`, and `bool`.
* They can be used to declare variables, such as `x = 5` or `y = true`.
* Simple data types can be used in expressions and statements, such as `x + 5` or `if (y == true)`.
* They have specific ranges of values, such as `int` typically ranging from -2147483648 to 2147483647.

# 4. Memory Lifecycle
* Simple data types have a fixed size in memory, such as `int` typically taking up 4 bytes.
* They are stored in memory as a single contiguous block of bytes.
* Simple data types have a limited range of values, and attempting to store a value outside of this range can result in an error or overflow.
* They are typically allocated on the stack, which means they are created and destroyed automatically when they go out of scope.

---

## 5. Worked Example

```cpp
#include <iostream>

int main() {
    int x = 5;  // declare and initialize an integer variable
    float y = 3.14;  // declare and initialize a floating-point variable
    char z = 'A';  // declare and initialize a character variable
    bool flag = true;  // declare and initialize a boolean variable

    std::cout << "x = " << x << std::endl;
    std::cout << "y = " << y << std::endl;
    std::cout << "z = " << z << std::endl;
    std::cout << "flag = " << flag << std::endl;

    return 0;
}
```

### Execution Walkthrough
1. The program starts by including the `iostream` header file for input/output operations.
2. In the `main` function, four variables are declared and initialized: `x` as an integer, `y` as a floating-point number, `z` as a character, and `flag` as a boolean.
3. The program then uses `std::cout` to print the values of these variables to the console.

---

## 6. Socratic Probes

**Scenario-Based Question**: What are the basic data types used in the provided C++ code?

**Implementation Challenge**: Suppose you want to store the user's age, name, and whether they are a student or not. How would you declare and initialize these variables using simple data types in C++?

**Debug Challenge**: Find the potential memory issue in the code: ```cpp
int* createInt() {
    int x = 10;
    return &x;
}
```

```

---

### Answer Key
- L1_SCENARIO: The basic data types used in the provided C++ code are `int`, `float`, `char`, and `bool`.
- L2_IMPLEMENTATION: You can declare and initialize these variables as follows:
```cpp
int age = 20;
char name[] = "John";  // Note: char array for string
bool isStudent = true;
```
- L3_DEBUG: The potential memory issue in the code is that it returns a pointer to a local variable `x`, which goes out of scope when the function `createInt` returns, resulting in a dangling pointer. The correct approach would be to dynamically allocate memory using `new` and `delete`. 
```cpp
int* createInt() {
    int* x = new int;
    *x = 10;
    return x;
}
```
Remember to `delete` the allocated memory when it's no longer needed to prevent memory leaks.