---
title: Function Prototype
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
A function prototype is like a blueprint for a function. It tells the compiler what the function looks like, including its name, return type, and parameters, without providing the implementation.

## 2. Technical Deep-Dive
In C++, a function prototype, also known as a function declaration or function signature, is a statement that declares a function. It specifies the function's name, return type, and parameter list. The primary purpose of a function prototype is to inform the compiler about the existence of a function, its return type, and how to call it. This is crucial for several reasons:

1. **Forward Declaration**: It allows the compiler to know about a function before its actual definition. This is particularly useful when functions call each other.

2. **Function Overloading**: Function prototypes enable function overloading, where multiple functions with the same name can be defined, provided they have different parameter lists.

3. **Compilation and Linking**: The compiler uses function prototypes to check the correctness of function calls. It verifies that the number and types of arguments match the function prototype.

A function prototype consists of:
- **Return Type**: The data type of the value returned by the function.
- **Function Name**: The name of the function.
- **Parameter List**: A list of parameters, including their types.

For example:

```cpp
int add(int a, int b);

Here, `int` is the return type, `add` is the function name, and `(int a, int b)` is the parameter list.

Function prototypes are typically placed in header files (`.h` or `.hpp`), allowing multiple source files to include them and use the functions.

```

### Example Use Case

```cpp
// In a header file (e.g., math_functions.h)
int add(int a, int b);
int multiply(int a, int b);

// In a source file (e.g., math_functions.cpp)
#include
```

## 3. Step-by-Step Visualization
### The Artifact

```cpp

```


### Logic Walkthrough / Execution Trace


## 4. The Trap (Edge Case Analysis)

---

## 5. Question

**Scenario-Based Question**: What happens if a function prototype is not provided for a function that is called in a C++ program?

**Implementation Challenge**: What is the purpose of a function prototype in C++, and how does it differ from a function definition?

**Socratic Debugger**:

```cpp
int add(int a, int b)
{
    return a + b;
}

int main()
{
    int result = add(5);
    return 0;
}
```

How do you fix the bug in this code?