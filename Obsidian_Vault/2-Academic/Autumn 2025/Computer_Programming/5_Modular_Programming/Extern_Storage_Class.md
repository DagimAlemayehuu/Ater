---
title: Extern Storage Class
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 31
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
The `extern` keyword in C++ is like a messenger that says, 'Hey, I know you're defined somewhere else, but I want to use you here.' It's commonly used for sharing variables or functions across multiple source files.

## 2. Technical Deep-Dive
The `extern` storage class in C++ is used to declare a variable or function that is defined elsewhere in the program, typically in another source file. This allows multiple source files to access the same variable or function. The `extern` keyword is often used in header files to declare variables or functions that are defined in a corresponding source file. When a variable is declared with `extern`, it means that the variable is defined elsewhere, and the current file is just referencing it. The `extern` storage class has linkage, meaning it can be accessed from other files. It's essential to ensure that the `extern` variable or function is defined only once in the entire program to avoid linker errors.

## 3. Step-by-Step Visualization
### The Artifact

```cpp
// Extern storage class example

extern int x;
int main() {
    extern int x;
    x = 10;
    return 0;
}
```


### Logic Walkthrough / Execution Trace
1. Declaration: `extern int x;`
2. Definition (in another file): `int x;`
3. Usage: `x = 10;`

## 4. The Trap (Edge Case Analysis)
A common pitfall with `extern` is forgetting to define the variable or function in exactly one source file, leading to linker errors. For example, if you declare `extern int x;` in multiple files but define `int x;` in none or more than one file, you'll get errors.