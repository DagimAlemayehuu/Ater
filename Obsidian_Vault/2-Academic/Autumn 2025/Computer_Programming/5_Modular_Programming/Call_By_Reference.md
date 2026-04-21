---
title: Call by Reference
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 41
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
## Explanation

Imagine you're at a restaurant and you want to order food. In call by value, you would tell the waiter what you want, and they would go to the kitchen, make the order, and bring it back to you. However, if you wanted to make any changes to your order, you would have to tell the waiter again, and they would go back to the kitchen to make the changes.

In call by reference, you give the waiter a piece of paper with your order on it, and they go to the kitchen. If you want to make any changes to your order, you can simply cross out the old order and write in the new one on the same piece of paper. The waiter can then take the updated paper to the kitchen, and they can make the changes directly.

## Deep Dive

In C++, when we pass variables to functions, we can use call by reference to modify the original variable. This is achieved by using a reference operator (&) in the function parameter list.

```cpp
void swap(int& a, int& b) {
    // Swap the values of a and b
    int temp = a;
    a = b;
    b = temp;
}
```

In this example, `a` and `b` are reference parameters. When we call the `swap` function, we pass the addresses of the variables we want to swap.

```cpp
int x = 5;
int y = 10;
swap(x, y);
```

The `swap` function modifies the original variables `x` and `y` directly, so after the function call, `x` will be 10 and `y` will be 5.

### Benefits

Call by reference is useful in three situations:

| Situation | Description |
| --- | --- |
| Returning multiple values | When a function needs to return more than one value, call by reference can be used to modify multiple variables. |
| Changing the actual parameter | When a function needs to modify the original variable, call by reference can be used to change the actual parameter. |
| Saving memory space and time | When passing a large object, call by reference can save memory space and time by avoiding the need to copy the object. |

## Artifact

Here is a complete code example demonstrating call by reference:

```cpp
#include <iostream>

// Function to swap two integers using call by reference
void swap(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

// Function to increment a counter using call by reference
void increment(int& counter) {
    counter++;
}

int main() {
    int x = 5;
    int y = 10;
    int counter = 0;

    std::cout << "Before swap: x = " << x << ", y = " << y << std::endl;
    swap(x, y);
    std::cout << "After swap: x = " << x << ", y = " << y << std::endl;

    std::cout << "Before increment: counter = " << counter << std::endl;
    increment(counter);
    std::cout << "After increment: counter = " << counter << std::endl;

    return 0;
}
```

## Walkthrough

Here are the steps to understand the code:

1.  We define a `swap` function that takes two reference parameters `a` and `b`.
2.  Inside the `swap` function, we swap the values of `a` and `b` using a temporary variable.
3.  We define an `increment` function that takes a reference parameter `counter`.
4.  Inside the `increment` function, we increment the value of `counter`.
5.  In the `main` function, we declare three integers `x`, `y`, and `counter`.
6.  We print the values of `x` and `y` before swapping, call the `swap` function, and then print the values again to verify the swap.
7.  We print the value of `counter` before incrementing, call the `increment` function, and then print the value again to verify the increment.

## The Trap

A common pitfall when using call by reference is to pass a literal value or a temporary result to a function that expects a reference parameter. For example:

```cpp
void increment(int& x) {
    x++;
}

int main() {
    increment(5); // Error: cannot bind non-const reference to a temporary
    return 0;
}
```

To fix this issue, we can modify the `increment` function to accept a non-reference parameter or use a const reference:

```cpp
void increment(int& x) {
    x++;
}

int main() {
    int x = 5;
    increment(x); // OK
    return 0;
}
```

Alternatively, we can use a const reference:

```cpp
void print(const int& x) {
    std::cout << x << std::endl;
}

int main() {
    print(5); // OK
    return 0;
}
```

## Search Keywords

*   Call by reference
*   Reference parameters
*   C++ functions
*   Passing by reference
*   Modifying original variables
*   Returning multiple values

{"source_pages": ["PAGE 1"]}

## 2. Technical Deep-Dive
FALLBACK: Check raw JSON block in explanation field.

## 3. Step-by-Step Visualization
### The Artifact

```cpp

```


### Logic Walkthrough / Execution Trace


## 4. The Trap (Edge Case Analysis)

---

## 5. Question

**Scenario-Based Question**: What happens if a function modifies a variable passed by reference, and then the original variable is used outside the function?

**Implementation Challenge**: Write a C++ function that swaps two integers using call by reference. The function should take two reference parameters and swap their values.

**Socratic Debugger**:

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