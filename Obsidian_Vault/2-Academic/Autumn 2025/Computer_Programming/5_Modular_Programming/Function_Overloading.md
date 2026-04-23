---
title: Function Overloading
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 52
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Functions]]"
---

# 1. Technical Definition
Function overloading is a programming concept where multiple functions with the same `function_name` can be defined, but with different `parameter lists`, allowing the correct function to be called based on the number and types of arguments passed. This is resolved at compile-time, and the function to be invoked is determined by the function's `signature`.

# 2. Mental Model
Imagine you have a friend named "Chef" who can make different dishes. You can ask Chef for a sandwich, a salad, or a soup, and Chef will make the correct one based on what you ask for. Just like how Chef can make different dishes, function overloading lets a programmer define multiple functions with the same name, but that do different things based on what information you give to the function.

# 3. Syntax Mechanics
* Functions must have the same name.
* Functions must have different parameter lists (different number or types of parameters).
* The return type can be the same or different.
* Functions must be distinguishable by their parameter lists.

# 4. Memory Lifecycle
* The compiler resolves function calls at compile-time, not runtime.
* The number of overloaded functions is limited only by the programmer's needs and code readability.
* Each overloaded function has its own memory allocation and deallocation.
* The function's signature (name and parameter list) determines which function is called, not the function's return type.

---

## 5. Worked Example

```cpp
#include <iostream>
using namespace std;

// Function to calculate area of rectangle
int calculateArea(int length, int width) {
    return length * width;
}

// Function to calculate area of circle
double calculateArea(double radius) {
    return 3.14159 * radius * radius;
}

// Function to calculate area of square
int calculateArea(int side) {
    return side * side;
}

int main() {
    cout << "Area of rectangle: " << calculateArea(5, 3) << endl;
    cout << "Area of circle: " << calculateArea(4.0) << endl;
    cout << "Area of square: " << calculateArea(4) << endl;
    return 0;
}
```

### Execution Walkthrough
1. The program starts execution from the `main` function.
2. It calls `calculateArea(5, 3)`, which matches the function with two `int` parameters, and prints the result.
3. It calls `calculateArea(4.0)`, which matches the function with one `double` parameter, and prints the result.
4. It calls `calculateArea(4)`, which matches the function with one `int` parameter, and prints the result.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary condition for function overloading in C++?

**Implementation Challenge**: Suppose you want to add a function to calculate the area of a triangle. How would you overload the `calculateArea` function to achieve this?

**Debug Challenge**: Find the bug in the following code and explain why function overloading fails:
```cpp
int calculateArea(int side) {
    return side * side;
}

int calculateArea(int side) {
    return side * side * 2;
}
```

---

### Answer Key
* L1_SCENARIO: The primary condition for function overloading in C++ is that functions must have the same name but different parameter lists.
* L2_IMPLEMENTATION: You can overload the `calculateArea` function to calculate the area of a triangle by adding a new function with a different parameter list, for example: `double calculateArea(double base, double height) { return 0.5 * base * height; }`.
* L3_DEBUG: The bug in the code is that there are two functions with the same name and parameter list. Function overloading fails because the functions must be distinguishable by their parameter lists. To fix this, you can change the name of one of the functions or modify the parameter list of one of them. For example, you can rename one of the functions to `calculateSquareArea` or change the parameter list to `calculateArea(int side, int factor)`.