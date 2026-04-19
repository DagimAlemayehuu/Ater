---
title: Function_Overloading_Examples
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Function_Overloading]]
source: [[Chapter 5.Pdf]]
source_pages:
- 52
- 54
mode: ENGINEER

---

# Definition & Mechanics
Function overloading is a feature in C++ that allows multiple functions with the same name to be defined, as long as they have different parameter lists. This enables functions to perform similar tasks but with different data types.

* **Key characteristics:**
  + Functions must have the same name.
  + Functions must have different parameter lists.
  + Functions can have different return types, but this alone does not constitute overloading.
* **Example:** 
  cpp
  int add(int a, int b) { return a + b; }
  double add(double a, double b) { return a + b; }
```text

# Worked Example
Domain: Medical imaging

Suppose we want to calculate the area of different shapes in a medical imaging context. We can overload the `calculateArea` function to handle different shapes:

```cpp
#include <iostream>

// Function to calculate area of a rectangle
int calculateArea(int length, int width) {
  return length * width;
}

// Function to calculate area of a circle
double calculateArea(double radius) {
  const double pi = 3.14159;
  return pi * radius * radius;
}

int main() {
  int length = 5, width = 3;
  double radius = 4.0;

  std::cout << "Area of rectangle = " << calculateArea(length, width) << std::endl;
  std::cout << "Area of circle = " << calculateArea(radius) << std::endl;

  return 0;
}
```

# Edge Case
> **Q:** Consider the following overloaded functions:
> cpp
> void compute(int a, long b) { std::cout << "compute(int, long) called" << std::endl; }
> void compute(long a, int b) { std::cout << "compute(long, int) called" << std::endl; }
> 
> What happens when we call `compute(10, 20)`?
> **A:** The call is ambiguous because `10` can be implicitly converted to either `int` or `long`, and `20` can also be implicitly converted to either `int` or `long`. The compiler cannot decide which function to call, resulting in a compilation error.

# Connections
- **Depends on:** [[Function_Overloading]] — Function overloading examples rely on the definition and rules of function overloading.
- **Enables:** [[Function_Call_By_Value_And_Reference]] — Understanding function overloading helps in choosing between call by value and call by reference.