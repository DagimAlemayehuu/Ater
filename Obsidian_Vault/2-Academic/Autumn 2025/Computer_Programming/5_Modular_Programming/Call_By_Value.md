---
title: Call by Value
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
---

# 1. Technical Definition
Call by Value is a `parameter passing mechanism` where a `copy` of the actual argument's value is passed to the function, allowing the function to operate on a local copy of the data. This approach ensures that the original argument remains unchanged, as modifications are made to the local copy.

# 2. Syntax Mechanics
* In Call by Value, the `actual argument` is evaluated, and its value is used to initialize the `formal parameter`.
* The `formal parameter` is a local variable that receives the copied value, allowing the function to operate on it independently.
* Any modifications made to the `formal parameter` within the function do not affect the original `actual argument`.
* The `scope` of the `formal parameter` is limited to the function, and its lifetime is tied to the function's execution.

# 3. Memory Lifecycle
* The `formal parameter` has a limited lifetime, existing only during the function's execution, and its memory is deallocated upon function return.
* The `actual argument` remains unchanged, as its value is copied and passed to the function, ensuring data integrity.
* The `stack` is used to manage the memory allocation and deallocation for the `formal parameter`.
* The `compiler` is responsible for generating code that performs the necessary copying and initialization of the `formal parameter`.

---

## 4. Worked Example

```cpp
#include <iostream>

// Example of Call by Value in C++
void modifyValue(int x) {
    // Modifying the formal parameter
    x = 20;
    std::cout << "Inside function: " << x << std::endl;
}

int main() {
    int actualArgument = 10;
    std::cout << "Before function call: " << actualArgument << std::endl;
    
    // Passing the actual argument by value
    modifyValue(actualArgument);
    
    std::cout << "After function call: " << actualArgument << std::endl;
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
    "question": "A function is called with an actual argument of 10. Within the function, the formal parameter is modified to 20. What is the value of the actual argument after the function call in Call by Value?",
    "answer": "The actual argument remains 10.",
    "explanation": "In Call by Value, modifications to the formal parameter do not affect the actual argument."
  },
  {
    "id": "q2",
    "type": "mcq",
    "difficulty": "L2",
    "question": "What is the primary characteristic of Call by Value?",
    "options": {
      "A": "The function receives a reference to the actual argument.",
      "B": "The function receives a copy of the actual argument's value.",
      "C": "The function modifies the actual argument directly.",
      "D": "The function uses a global variable."
    },
    "answer": "B",
    "explanation": "In Call by Value, a copy of the actual argument's value is passed to the function."
  },
  {
    "id": "q3",
    "type": "fill_in",
    "difficulty": "L3",
    "question": "In Call by Value, the memory for the formal parameter is managed on the [[Blank1]] and is deallocated upon [[Blank2]].",
    "textWithBlanks": "In Call by Value, the memory for the formal parameter is managed on the [[Blank1]] and is deallocated upon [[Blank2]].",
    "answer": ["stack", "function return"],
    "explanation": "The formal parameter's memory is allocated on the stack and deallocated when the function returns."
  }
]
```