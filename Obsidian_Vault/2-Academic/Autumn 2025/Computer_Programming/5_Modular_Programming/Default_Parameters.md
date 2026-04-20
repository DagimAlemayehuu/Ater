---
title: Default Parameters
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 34
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
Default parameters in C++ allow for function parameters to have default values if no arguments are provided. This is useful for providing a default behavior when a user doesn't specify all parameters.

## 2. Technical Deep-Dive
In C++, when defining a function, you can assign a default value to a parameter by using the assignment operator (=) in the function parameter list. For example, consider the following function: cpp
void greet(const std::string& name =

## 3. Step-by-Step Visualization
### The Artifact

```cpp

```


### Logic Walkthrough / Execution Trace
Let's walk through an example of using default parameters in a function. Suppose we have a simple function that greets a person by name: cpp
void greet(const std::string& name) {
    std::cout << \

## 4. The Trap (Edge Case Analysis)
One common trap with default parameters is the issue of linker errors when default parameters are defined inconsistently across multiple source files. For example, suppose we have a header file `func.h` with the following declaration: cpp
void func(int x = 10);
 

And two source files `func.cpp` and `another_func.cpp` with the following definitions: cpp
// func.cpp
void func(int x) {
    std::cout << \