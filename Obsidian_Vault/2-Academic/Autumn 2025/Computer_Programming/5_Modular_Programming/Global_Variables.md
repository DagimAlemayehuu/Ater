---
title: Global Variables
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 21
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
Imagine you have a big box in your living room where you keep a snack. Everyone in the house can access this box and take a snack. In programming, this box is like a global variable. It's a variable that is not inside any specific function but can be accessed from anywhere in the program.

## 2. Technical Deep-Dive
In C++, a global variable is a variable that is defined outside of any function or class. Global variables have a global scope, meaning they can be accessed from any part of the program. Here are some key points to consider when using global variables:

- **Definition**: Global variables are defined outside of any function or class, typically at the top of a source file.
- **Scope**: Global variables have a global scope, which means they can be accessed from any part of the program.
- **Lifetime**: Global variables are initialized before the `main()` function is called and persist until the program terminates.
- **Linkage**: By default, global variables have external linkage, which means they can be accessed from other source files if they are declared with the `extern` keyword.

### Example Use Case

```cpp
// globals.cpp
int globalVariable = 10;

int main() {
    // Accessing the global variable
    globalVariable = 20;
    return 0;
}
```

### Advantages and Disadvantages

**Advantages:**
- Global variables can be used to share data between different parts of a program.
- They can simplify code by eliminating the need to pass data as function arguments.

**Disadvantages:**
- Global variables can lead to name clashes if multiple source files define variables with the same name.
- They can make code harder to understand and maintain because their values can be changed from anywhere in the program.
- Overuse of global variables can lead to poor program design.

### Best Practices

- Use global variables sparingly and only when necessary.
- Prefer local variables and function arguments to pass data between functions.
- Use the `const` keyword to declare constants that should not be modified.
- Avoid using global variables with the same name in different source files.

## 3. Step-by-Step Visualization
### The Artifact

```cpp
int globalVariable = 10;

int main() {
    // Accessing the global variable
    globalVariable = 20;
    return 0;
}
```


### Logic Walkthrough / Execution Trace
```cpp
int globalVariable = 10; // Global variable definition

int main() {
    globalVariable = 20; // Accessing and modifying the global variable
    return 0;
}
```


## 4. The Trap (Edge Case Analysis)
One common pitfall with global variables is that they can be modified accidentally. For example, if multiple parts of the program modify the global variable without proper synchronization, it can lead to unpredictable behavior. To avoid this, use mutexes or locks when accessing global variables in multi-threaded programs.

---

## 5. Question

**Scenario-Based Question**: What happens if multiple functions in a program try to modify the same global variable simultaneously?

**Implementation Challenge**: A global variable is defined as `int globalVariable = 10;`. Write a simple C++ function that increments the value of this global variable by 5.

**Socratic Debugger**:

```cpp
int globalVariable = 10;

int main() {
    globalVariable = 20;
    globalVariable = 30;
    return 0;
}
```
However, the intention was to increment the global variable by 10, not overwrite it. How can you modify the code to achieve this?