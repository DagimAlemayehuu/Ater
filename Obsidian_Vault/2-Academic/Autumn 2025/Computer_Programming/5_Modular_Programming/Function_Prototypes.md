---
title: Function Prototypes
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 5
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
A function prototype is like a blueprint for a function. It tells the compiler what the function looks like, including its name, what it returns, and what inputs it expects.

## 2. Technical Deep-Dive
Function prototypes, also known as function declarations or function signatures, are used to declare a function's name, return type, and parameters before its actual definition. This allows the compiler to know about the function's existence and its properties before it is used. The syntax of a function prototype is as follows: `return-type function-name(parameter-list);`. Here, `return-type` is the data type of the value returned by the function, `function-name` is the name of the function, and `parameter-list` is a list of parameters that the function takes.

## 3. Step-by-Step Visualization
### The Artifact

```cpp
#include <iostream>

// Function prototype
int add(int a, int b);

int main() {
    int result = add(5, 10);
    std::cout << "Result: " << result << std::endl;
    return 0;
}

// Function definition
int add(int a, int b) {
    return a + b;
}
```


### Logic Walkthrough / Execution Trace
1. The function prototype `int add(int a, int b);` is declared.
2. In `main`, the `add` function is called with arguments `5` and `10`.
3. The `add` function is defined to take two integers and return their sum.

## 4. The Trap (Edge Case Analysis)
A common trap is forgetting to update the function prototype when changing the function's parameters or return type. This can lead to compiler errors if the function is used elsewhere in the code.

---

## 5. Question

**Scenario-Based Question**: What happens if a function prototype is not provided before the function call?

**Implementation Challenge**: What is the syntax for a function prototype in C++?

**Socratic Debugger**:

```cpp
int add(int a);
int main() {
    int result = add(5, 10);
    std::cout << "Result: " << result << std::endl;
    return 0;
}
int add(int a) {
    return a + 5;
}
```