---
title: Pass_by_Value_vs_Reference
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 45
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you have a piggy bank where you store your money. When you give your piggy bank to a friend, there are two ways this can happen: either you give them the actual piggy bank with the money inside (pass by reference), or you take the money out of your piggy bank and give them a piece of paper with the amount of money written on it (pass by value). If your friend adds more money to the piggy bank or the piece of paper, it affects either the original piggy bank or just the piece of paper.

# 2. Execution Logic & Data Flow
In the context of programming, when a function is called with an argument, the argument can be passed either by value or by reference. When passed by value, a [[Copy_Constructor]] is implicitly called to create a local copy of the argument in the [[Stack_Frame]] of the function. Any modifications made to the argument within the function do not affect the original variable outside the function. For example, in the given C++ code, `int x` in the `increment` function is a local copy of the value passed to it, so when `x = x + 1;` is executed, it only modifies the local copy. The original variable outside the function remains unchanged due to the [[Scope_Resolution]] rules.

# 3. Edge Cases & Failure States
When dealing with pass by reference, if a function is passed a reference to a local variable that goes out of scope once the function returns, it can lead to [[Dangling_Pointer]] issues. Additionally, passing by reference can also lead to unexpected behavior if the function modifies the original variable in ways that the caller does not expect. For instance, if the `increment` function were modified to accept a reference to an `int` (`void increment(int& x)`), then `x = x + 1;` would modify the original variable passed to it. However, this requires careful handling to avoid [[Aliasing]] issues, where multiple names refer to the same memory location, potentially causing confusion and bugs.
# 4. Implementation Mechanics
```cpp
#include <iostream>

void increment_by_value(int x) {
    x = x + 1;
    std::cout << "Inside function (by value): " << x << std::endl;
}

void increment_by_reference(int& x) {
    x = x + 1;
    std::cout << "Inside function (by reference): " << x << std::endl;
}

int main() {
    int original_value = 5;
    std::cout << "Original value: " << original_value << std::endl;
    
    increment_by_value(original_value);
    std::cout << "After increment by value: " << original_value << std::endl;
    
    increment_by_reference(original_value);
    std::cout << "After increment by reference: " << original_value << std::endl;
    
    return 0;
}
```
This C++ code demonstrates the difference between pass by value and pass by reference. The `increment_by_value` function creates a local copy of the passed argument, while `increment_by_reference` modifies the original variable.

## 5. Walkthrough
Here's a step-by-step walkthrough of the provided C++ code:

1. Initially, `original_value` is set to `5`.
2. `increment_by_value(original_value)` is called. A local copy of `original_value` (which is `5`) is created in the `increment_by_value` function.
3. Inside `increment_by_value`, `x` (the local copy) is incremented to `6` and printed. The output is `Inside function (by value): 6`.
4. After the function call, the local copy `x` is discarded, and the original `original_value` remains `5`. The output is `After increment by value: 5`.
5. `increment_by_reference(original_value)` is called. The address of `original_value` is passed to `increment_by_reference`.
6. Inside `increment_by_reference`, the value at the passed address (`original_value`) is incremented to `6` and printed. The output is `Inside function (by reference): 6`.
7. Since `increment_by_reference` modifies the original variable through its reference, `original_value` becomes `6`. The output is `After increment by reference: 6`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "When a function parameter is passed by value, a [[Blank1]] of the original variable is created in the function's stack frame.",
    "textWithBlanks": "When a function parameter is passed by value, a [[Blank1]] of the original variable is created in the function's stack frame.",
    "answer": [
      "copy"
    ],
    "explanation": "This is a fundamental concept in programming related to pass by value."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "Passing a variable by reference to a function can lead to unexpected behavior if the function modifies the original variable.",
    "answer": "True",
    "explanation": "This is because the caller might not expect the original variable to be changed."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code snippet.",
    "content": "void swap(int x, int y) { int temp = x; x = y; y = temp; }",
    "answer": "The function does not swap the original variables because it is passed by value. To fix, pass by reference: void swap(int& x, int& y).",
    "explanation": "The given code does not achieve the desired effect of swapping the original variables because it uses pass by value."
  }
]
```