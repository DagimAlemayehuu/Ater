---
title: Reference Parameters
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 40
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
Imagine you're trying to hand a delicate vase to a friend. You wouldn't just point to the vase and expect them to pick it up; you'd actually hand it over. In programming, when you want to modify a variable inside a function, you can use reference parameters to 'hand over' the variable, allowing the function to change the original value.

## 2. Technical Deep-Dive
In C++, when passing variables to functions, you can use reference parameters to allow the function to modify the original variables. This is achieved by using the `&` symbol in the function parameter list. 

   A reference parameter is an alias for a variable. When a reference parameter is passed to a function, it becomes an alternate name for the original variable. Any changes made to the reference parameter within the function affect the original variable.

   Here's an example:

```cpp
void swap(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int x = 5;
    int y = 10;

    std::cout <<
```

## 3. Step-by-Step Visualization
### The Artifact

```cpp

```


### Logic Walkthrough / Execution Trace
Let's walk through the execution of the `swap` function:

   1. In `main`, `x` is initialized to 5 and `y` is initialized to 10.
   2. The `swap` function is called with `x` and `y` as arguments.
   3. In `swap`, `a` and `b` are reference parameters that become aliases for `x` and `y`, respectively.
   4. The values of `a` and `b` are swapped using a temporary variable.
   5. Since `a` and `b` are references to `x` and `y`, the original values of `x` and `y` are swapped.
   6. The `swap` function returns, and the modified values of `x` and `y` are printed in `main`.

## 4. The Trap (Edge Case Analysis)
One common pitfall when using reference parameters is forgetting that they are aliases for the original variables. This can lead to unintended side effects if the function modifies the reference parameter in unexpected ways.

   For example:

```cpp
void foo(int& x) {
    x = 10;
}

int main() {
    int x = 5;
    foo(x);
    std::cout << x << std::endl;  // Prints 10
    return 0;
}

   In this example, the function `foo` modifies the reference parameter `x`, which affects the original variable `x` in `main`. If you're not careful, this can lead to bugs that are difficult to track down.

   To avoid this trap, make sure to clearly document your functions and use `const` reference parameters when possible to ensure that the function does not modify the original variable.
```