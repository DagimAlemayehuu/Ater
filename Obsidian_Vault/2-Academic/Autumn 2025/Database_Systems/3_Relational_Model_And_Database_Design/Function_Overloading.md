---
title: Function_Overloading
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Modular_Programming]]
source: [[Chapter 5.Pdf]]
source_pages:
- 52
- 53
- 54
mode: ENGINEER

---

# Definition & Mechanics
Function overloading is a feature in C++ that allows multiple functions with the same name to be defined, as long as they have different parameter lists. The functions must differ in either the number or types of parameters.

* **Key characteristics:**
	+ Functions must have the same name.
	+ Functions must have different parameter lists.
	+ The compiler selects the correct function based on the number, types, and order of arguments passed.
* **Types of function overloading:**
	+ Overloading by number of parameters: `void show(int a);`, `void show(int a, float b);`
	+ Overloading by parameter types: `void show(int a);`, `void show(float a);`

# Worked Example
Domain: Film production

Suppose we have a film production company that wants to calculate the area of different shapes for their movie sets. We can define overloaded functions to compute the area of a rectangle, circle, and square.

cpp
#include <iostream>

// Function to compute area of a rectangle
float area(float length, float width) {
    return length * width;
}

// Function to compute area of a circle
float area(float radius) {
    return 3.14159f * radius * radius;
}

// Function to compute area of a square
float area(int side) {
    return side * side;
}

int main() {
    float length = 5.0, width = 3.0;
    float radius = 4.0;
    int side = 6;

    std::cout << "Area of rectangle = " << area(length, width) << std::endl;
    std::cout << "Area of circle = " << area(radius) << std::endl;
    std::cout << "Area of square = " << area(side) << std::endl;

    return 0;
}
```text

# Edge Case
> **Q:** Consider the following function overloading example:
```cpp
void compute(int a, long b) {
    std::cout << "compute(int, long) called" << std::endl;
}

void compute(long a, int b) {
    std::cout << "compute(long, int) called" << std::endl;
}

int main() {
    compute(10, 20);
    return 0;
}
```
> **A:** The call `compute(10, 20)` is ambiguous because both functions can be called with the given arguments (10 can be promoted to long, and 20 can be promoted to long). The compiler cannot decide which function to call, resulting in a compilation error.

# Connections
- **Depends on:** [[Modular_Programming]] — Function overloading is a concept used in modular programming to define multiple functions with the same name but different behaviors.
- **Enables:** [[Function_Prototypes]] — Function overloading relies on function prototypes to declare the functions and their parameter lists.