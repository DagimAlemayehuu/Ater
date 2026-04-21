---
title: Modular Programming
type: Possible Questions
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
mode: SOCRATIC
generated: true
---

# Modular Programming

> [!ABSTRACT] Exam Readiness Protocol
> This note aggregates retrieval probes from all atomic nodes in this unit to ensure total coverage.

## 🎯 Master Question Bank

### [[Modular Programming Concept|Modular Programming Concept]]
**L1 Scenario**: What happens if a C++ module's header file is included multiple times in a program?

**L2 Implementation**: How would you implement a C++ module that calculates the area and perimeter of a rectangle, with the interface in a header file and the implementation in a source file?

**L3 Debug Challenge**:

```cpp
#ifndef RECTANGLE_H
#define RECTANGLE_H

int calculateArea(int width, int height) {
    return width * height;
}

int calculatePerimeter(int width, int height) {
    return 2 * (width + height);
}
#endif
```

The code above is intended to provide a C++ module for calculating the area and perimeter of a rectangle. However, there is a subtle issue with it. What is the problem and how can it be fixed?

### [[Benefits Of Modules|Benefits Of Modules]]
**L1 Scenario**: What happens if a C++ module's interface file changes, and multiple modules import it?

**L2 Implementation**: A module has a function `add` that takes two integers and returns their sum. The function is used in another module. What is the result of `add(5, 3)`?

**L3 Debug Challenge**:

```cpp
module mymath;
export int add(int a, int b) {
    return a + b;
}
export int subtract(int a, int b) {
    return a - b;
}
```
The code above has a subtle bug. How would you fix it to avoid the module interface file dependency pitfall?

### [[Functions In C++|Functions In C++]]
**L1 Scenario**: What happens if a C++ function has no return statement?

**L2 Implementation**: Write a C++ function that swaps two integers using pass by reference.

**L3 Debug Challenge**:

```cpp
int x = 5;
int &y = x;
y = 10;
std::cout << x << std::endl;
```
The code has a subtle conceptual trap related to reference parameters. How to fix it?

### [[Function Declaration|Function Declaration]]
**L1 Scenario**: What happens if you forget to include a function declaration before using the function in C++?

**L2 Implementation**: What is the purpose of the return-type in a function declaration?

**L3 Debug Challenge**:

Here's a broken code block: ```cpp int main() { int result = addNumbers(5, 10); return 0; } int addNumbers(int a, int b) { return a + b; } ```. How can you fix it?

### [[Function Prototypes|Function Prototypes]]
**L1 Scenario**: What happens if a function prototype is not provided before the function call?

**L2 Implementation**: What is the syntax for a function prototype in C++?

**L3 Debug Challenge**:

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

### [[Function Definitions|Function Definitions]]
**L1 Scenario**: What happens if you define a function in C++ without specifying its return type?

**L2 Implementation**: Write a C++ function that takes two integers as parameters and returns their sum.

**L3 Debug Challenge**:

How would you fix the following broken code block:
```cpp
addNumbers(int x, int y) {
    return x + y;
}
```

### [[Return Statement|Return Statement]]
**L1 Scenario**: What happens if a C++ function has multiple return statements?

**L2 Implementation**: A function has a return type of int and contains a conditional statement with two possible return values. What are the implications of using return statements in this context?

**L3 Debug Challenge**:

```cpp
int calculateValue(bool condition) {
    if (condition) {
        return 10;
    } else {
        // missing return statement
}
```
How can you fix this code to ensure it always returns a value?

### [[Identifier Scope|Identifier Scope]]
**L1 Scenario**: What happens if a variable declared in a local scope is accessed outside that scope?

**L2 Implementation**: A variable declared in a local scope is only accessible within that scope. If you try to access it outside, you will get a compiler error. For example, in the given code, `innerLocalVar` is declared within an inner local scope and cannot be accessed outside that scope.

**L3 Debug Challenge**:

```cpp
// Global scope
int globalVar = 10;

void func() {
    // Local scope
    int localVar = 20;
    {
        // Inner local scope
        int innerLocalVar = 30;
        std::cout << "Inner local scope:" << std::endl;
        std::cout << "globalVar: " << globalVar << std::endl;
        std::cout << "localVar: " << localVar << std::endl;
        std::cout << "innerLocalVar: " << innerLocalVar << std::endl;
    }
    // Error: innerLocalVar is not accessible here
    // std::cout << innerLocalVar << std::endl;
    std::cout << "Local scope:" << std::endl;
    std::cout << "globalVar: " << globalVar << std::endl;
    std::cout << "localVar: " << localVar << std::endl;
}

int main() {
    func();
    // Error: localVar is not accessible here
    // std::cout << localVar << std::endl;
    std::cout << "Global scope:" << std::endl;
    std::cout << "globalVar: " << globalVar << std::endl;
    return 0;
}
```

The bug in this code is that `innerLocalVar` is not accessible outside its scope. To fix this, you can declare `innerLocalVar` in a larger scope or pass it as a parameter to the function that needs to access it.

### [[Local Variables|Local Variables]]
**L1 Scenario**: What happens if a local variable is declared but not initialized before use in C++?

**L2 Implementation**: A local variable 'x' is declared within a function. What is the value of 'x' if it is not initialized before use?

**L3 Debug Challenge**:

```cpp
void exampleFunction() {
    int x;  // Not initialized
    std::cout << x << std::endl;  // Undefined behavior
}
```

### [[Global Variables|Global Variables]]
**L1 Scenario**: What happens if a global variable is accessed from multiple functions in a C++ program?

**L2 Implementation**: A global variable 'x' is defined and initialized to 5. Two functions, 'func1' and 'func2', are defined. 'func1' increments 'x' by 1, and 'func2' prints the value of 'x'. If 'func1' is called followed by 'func2', what will be the output?

**L3 Debug Challenge**:

```cpp
int x = 5;
void func1() {
    x++;
}
void func2() {
    cout << x;
}

int main() {
    func1();
    func2();
    return 0;
}
```
The code has a subtle bug. The bug is that the global variable 'x' is being modified accidentally. How can you fix this bug to ensure 'func2' prints the expected value?

### [[Reference Parameters|Reference Parameters]]
**L1 Scenario**: What happens if a function modifies a reference parameter?

**L2 Implementation**: A function swaps two numbers using reference parameters. What are the values of the numbers after the function call?

**L3 Debug Challenge**:

```cpp
void foo(int& a) {
    a = 10;
}

int main() {
    foo(5); // Error: cannot bind non-const reference to a temporary variable
    return 0;
}``` How do you fix this code?

```

### [[Call By Reference|Call By Reference]]
**L1 Scenario**: What happens if a function modifies a variable passed by reference, and then the original variable is used outside the function?

**L2 Implementation**: Write a C++ function that swaps two integers using call by reference. The function should take two reference parameters and swap their values.

**L3 Debug Challenge**:

```cpp
void increment(int& x) {
    x++;
}

int main() {
    increment(5); // Error: cannot bind non-const reference to a temporary
    return 0;
}
```

How can you fix this code to make it work correctly?