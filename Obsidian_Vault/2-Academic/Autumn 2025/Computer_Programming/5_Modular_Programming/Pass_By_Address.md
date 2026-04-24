---
title: Pass by Address
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages: []
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Pointers]]"
---

# 1. Technical Definition
Pass by address, also known as `call by reference`, is a method of passing arguments to a function where the actual memory address of the variable is passed, allowing the function to modify the original variable. This technique utilizes `pointers` to indirectly access and manipulate the original data.

# 2. Syntax Mechanics
* The function declaration includes a `pointer` parameter, denoted by the asterisk symbol (`*`) preceding the parameter name.
* When calling the function, the `address-of` operator (`&`) is used to obtain the memory address of the variable being passed.
* The function can modify the original variable by dereferencing the `pointer` using the unary `*` operator.
* The use of `const` correctness can be applied to ensure the function does not modify the original variable.

# 3. Memory Lifecycle
* The function has direct access to the original variable's memory location, allowing for efficient modification.
* The use of `pointers` can lead to issues with dangling pointers if the original variable goes out of scope.
* The function can allocate new memory and assign the address to the `pointer`, but the caller is responsible for deallocating the memory to prevent memory leaks.
* The `pointer` parameter can be `NULL` or invalid, requiring the function to perform error checking to prevent crashes or undefined behavior.

---

## 4. Worked Example

```cpp
#include <iostream>

// Function to swap two integers using pass by reference
void swap(int* a, int* b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    int x = 5;
    int y = 10;

    std::cout << "Before swap: x = " << x << ", y = " << y << std::endl;

    // Pass the addresses of x and y to the swap function
    swap(&x, &y);

    std::cout << "After swap: x = " << x << ", y = " << y << std::endl;

    return 0;
}
```

---

## 5. Knowledge Check

```interactive-quiz
[
  {
    "id": "q1",
    "type": "scenario",
    "difficulty": "L1",
    "question": "A function is declared with a pointer parameter. What operator is used to obtain the memory address of a variable when calling the function?",
    "answer": "&",
    "explanation": "The address-of operator (&) is used to obtain the memory address of a variable when passing it to a function that expects a pointer parameter."
  },
  {
    "id": "q2",
    "type": "debug",
    "difficulty": "L2",
    "question": "Find the bug in the following code snippet: void increment(int* x) { (*x)++; } int main() { int x = 5; increment(x); std::cout << x << std::endl; return 0; }",
    "content": "void increment(int* x) { (*x)++; } int main() { int x = 5; increment(x); std::cout << x << std::endl; return 0; }",
    "answer": "The bug is that the address-of operator (&) is not used when calling the increment function. The correct call should be increment(&x);",
    "explanation": "The increment function expects a pointer to an integer, but the address-of operator (&) is not used when calling the function, resulting in a compile-time error."
  },
  {
    "id": "q3",
    "type": "fill_in",
    "difficulty": "L3",
    "question": "When using pass by reference, the function can modify the original variable by [[Blank1]] the pointer using the unary [[Blank2]] operator.",
    "textWithBlanks": "When using pass by reference, the function can modify the original variable by [[Blank1]] the pointer using the unary [[Blank2]] operator.",
    "answer": ["dereferencing", "*"],
    "explanation": "The function can modify the original variable by dereferencing the pointer using the unary * operator, allowing direct access to the original data."
  }
]
```