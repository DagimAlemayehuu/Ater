---
title: Call_by_Reference_Example
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 44
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you have a labeled box where you store your toys, and you give a friend a map that leads directly to your box. If your friend uses the map to go to your box and swap the toys inside, the toys in your box will actually be swapped. This is similar to how `swap2` function works, where it takes a "map" (or reference) to the original variables and swaps their values directly.

# 2. Execution Logic & Data Flow
The `swap2` function takes two references to integers, `a` and `b`, which are essentially aliases for the original variables passed to the function. When `swap2` is called, it creates a [[Stack_Frame]] on the [[Call_Stack]], and the references `a` and `b` are bound to the original variables. The function then uses a temporary variable `hold` to swap the values of `a` and `b`, modifying the original variables directly through the references. The [[Lvalue]] references `a` and `b` allow the function to modify the original variables, and the [[Assignment_Operator]] is used to update the values. Once the swap is complete, the function returns, and the [[Stack_Frame]] is popped from the [[Call_Stack]].

# 3. Edge Cases & Failure States
If the caller passes variables that are not [[Lvalue]]s, such as literals or expressions, the code will not compile, as the function requires [[Lvalue]] references. For example, calling `swap2(5, 10)` will result in a compiler error. Additionally, if the variables passed to the function are not properly initialized or are [[Aliased]], unexpected behavior may occur. The function also assumes that the [[Memory_Model]] allows for the modification of the original variables through references. If the input variables are [[Const]], the function will also not compile, as it requires non-const references.
# 4. Implementation Mechanics
```cpp
#include <iostream>

void swap2(int*& a, int*& b) {
  int hold = *a;
  *a = *b;
  *b = hold;
}

int main() {
  int x = 5;
  int y = 10;
  std::cout << "Before swap: x = " << x << ", y = " << y << std::endl;
  swap2(&x, &y);
  std::cout << "After swap: x = " << x << ", y = " << y << std::endl;
  return 0;
}
```
This C++ code demonstrates the `swap2` function, which takes references to integers and swaps their values. The `main` function showcases the usage of `swap2` by swapping the values of `x` and `y`.

To read this code: The `swap2` function takes two references to integers, `a` and `b`, and uses a temporary variable `hold` to swap their values. In the `main` function, we create two integers `x` and `y`, print their values before and after calling `swap2`, which swaps their values.

## 5. Walkthrough
Here's a step-by-step walkthrough of the `swap2` function:

1. The `main` function initializes two integers, `x` and `y`, with values 5 and 10, respectively.
2. The `swap2` function is called with the addresses of `x` and `y` as arguments, i.e., `&x` and `&y`.
3. Inside `swap2`, the values of `x` and `y` are accessed through the references `a` and `b`, and a temporary variable `hold` is used to store the value of `*a` (i.e., `x`).
4. The value of `*b` (i.e., `y`) is assigned to `*a` (i.e., `x`), effectively updating the value of `x` to 10.
5. The value stored in `hold` (i.e., the original value of `x`, which is 5) is assigned to `*b` (i.e., `y`), effectively updating the value of `y` to 5.
6. The `swap2` function returns, and the values of `x` and `y` are printed again, showing that they have been swapped.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The swap2 function takes [[Blank1]] to integers as arguments.",
    "textWithBlanks": "The swap2 function takes [[Blank1]] to integers as arguments.",
    "answer": [
      "references"
    ],
    "explanation": "The swap2 function takes references to integers as arguments, allowing it to modify the original variables."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "The swap2 function can swap the values of two integer literals.",
    "answer": "False",
    "explanation": "The swap2 function requires lvalue references as arguments, which integer literals do not provide."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code.",
    "content": "void swap2(int* a, int* b) { int hold = *a; *a = *b; *b = hold; }",
    "answer": "The bug is that the function does not take references to integers as arguments, but rather pointers. The correct code should be void swap2(int*& a, int*& b).",
    "explanation": "The bug is due to the missing '&' operator, which is necessary to pass references to integers."
  }
]
```