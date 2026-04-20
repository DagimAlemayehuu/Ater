---
title: Automatic Variables
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 29
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
Automatic variables in C++ are those that are declared within a block or function and are automatically destroyed when the block or function is exited. They are also known as local variables or stack variables.

## 2. Technical Deep-Dive
In C++, automatic variables are those that are declared within a block or function and are automatically destroyed when the block or function is exited. These variables have a scope that is limited to the block in which they are declared. The lifetime of an automatic variable begins when its declaration is encountered during execution and ends when the block is exited. Automatic variables are also known as local variables or stack variables because they are stored on the stack. The storage class specifier for automatic variables is `auto`, but it is rarely used because it is the default storage class for variables declared within a block. 

Automatic variables can be initialized with a value when they are declared. If they are not initialized, they contain indeterminate values. The compiler can sometimes initialize automatic variables with a default value, but this is not guaranteed. 

The key characteristics of automatic variables are:
- They are declared within a block or function.
- They have a scope limited to the block in which they are declared.
- Their lifetime begins when the block is entered and ends when the block is exited.
- They are stored on the stack.
- They are initialized with a value when declared, or they contain indeterminate values.

Here is an example of automatic variables:

```cpp
int main() {
    int x = 5;
    {
        int y = 10;
        cout << x << " " << y << endl;
    }
    return 0;
}
```

In this example, `x` and `y` are automatic variables. The variable `x` is declared in the `main` function and has a lifetime that extends until the `main` function returns. The variable `y` is declared within a block inside the `main` function and has a lifetime that extends until the block is exited. The scope of `x` is the entire `main` function, while the scope of `y` is limited to the block in which it is declared.

## 3. Step-by-Step Visualization
### The Artifact

```cpp
int main() {
    int x = 5;
    {
        int y = 10;
        cout << x << " " << y << endl;
    }
    return 0;
}
```


### Logic Walkthrough / Execution Trace
1. The program starts executing the `main` function.
2. The variable `x` is declared and initialized with the value 5.
3. A block is entered, and the variable `y` is declared and initialized with the value 10.
4. The values of `x` and `y` are printed to the console.
5. The block is exited, and the variable `y` is destroyed.
6. The `main` function returns, and the variable `x` is destroyed.

## 4. The Trap (Edge Case Analysis)
One common pitfall with automatic variables is forgetting that they are destroyed when their block is exited. This can lead to dangling pointers or references if the variable's memory location is accessed after it has been destroyed.