---
title: Function Overloading
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 52
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
Function overloading is a feature in programming where multiple functions with the same name can be defined, but with different parameter lists. This allows for more flexibility in function calls, as the correct function to invoke is determined by the number and types of arguments passed.

## 2. Technical Deep-Dive
Function overloading is a form of compile-time polymorphism, which enables the `compiler` to resolve the correct function to call based on the `function signature`. The function signature consists of the function name, return type, and parameter list. When overloading functions, the return type can be the same or different, but the parameter list must be distinct.

In C++, function overloading is achieved by defining multiple functions with the same name but different parameter lists. For example:

```cpp
void print(int value) {
    std::cout <<
```

## 3. Step-by-Step Visualization
### The Artifact

```cpp

```


### Logic Walkthrough / Execution Trace
Let's walk through the execution of the `main` function:

1.  `print(10);` calls the `print` function with an `int` argument, which matches the first overloaded function.
2.  `print(

## 4. The Trap (Edge Case Analysis)
A common pitfall in function overloading is ambiguous function calls. For example:

```cpp
void print(int value) {
    std::cout <<
```

---

## 5. Question

**Scenario-Based Question**: What happens if two functions with the same name but different parameter lists are defined and called with different arguments?

**Implementation Challenge**: A programmer defines two functions named 'calculateArea' with different parameter lists: one takes a single integer (side length of a square) and the other takes two integers (length and width of a rectangle). If the programmer calls 'calculateArea(5)' and 'calculateArea(4, 6)', which functions will be invoked and what will be the output?

**Socratic Debugger**:

```cpp
void ambiguousOverload(int x, int y) {
    std::cout << "Sum: " << x + y << std::endl;
}

void ambiguousOverload(int x) {
    std::cout << "Square: " << x * x << std::endl;
}

int main() {
    ambiguousOverload(5, 10);
    ambiguousOverload(5);
    return 0;
}
```

How can you fix the code to avoid ambiguous function calls?