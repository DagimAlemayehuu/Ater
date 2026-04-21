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
Imagine you're at a restaurant and you want to order food. You can't just give the waiter a piece of paper with your order on it and expect them to go buy the ingredients for you. Instead, you give the waiter a verbal order, and they go to the kitchen to prepare it. If you want to make changes to your order, you don't give the kitchen a new piece of paper; you tell the waiter, and they adjust the order.

In programming, when you pass a variable to a function, it's like giving the waiter a piece of paper. By default, the function gets a copy of the information on the paper (a "value parameter"). But if you want the function to directly work with the original paper (the variable), you make the parameter a "reference parameter". This way, any changes the function makes are directly on the original paper.

## 2. Technical Deep-Dive
In C++, when a formal parameter is declared as a reference parameter, it receives the address of the corresponding actual parameter. This means that the reference parameter is essentially an alias for the actual parameter.

```cpp
void swap(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int x = 5;
    int y = 10;
    swap(x, y);
    // x is now 10, y is now 5
    return 0;
}
```

In the `swap` function, `a` and `b` are reference parameters. They store the addresses of `x` and `y` respectively. When we swap the values of `a` and `b`, we're directly modifying the values of `x` and `y`.

## 3. Step-by-Step Visualization
### The Artifact

```cpp
#include <iostream>

// Function to swap two numbers using reference parameters
void swap(int& a, int& b) {
    int temp = a; // Store the value of a in temp
    a = b;       // Assign the value of b to a
    b = temp;    // Assign the value of temp (originally a) to b
}

int main() {
    int num1 = 5;
    int num2 = 10;

    std::cout << "Before swapping:" << std::endl;
    std::cout << "num1 = " << num1 << std::endl;
    std::cout << "num2 = " << num2 << std::endl;

    // Call the swap function
    swap(num1, num2);

    std::cout << "After swapping:" << std::endl;
    std::cout << "num1 = " << num1 << std::endl;
    std::cout << "num2 = " << num2 << std::endl;

    return 0;
}
```


### Logic Walkthrough / Execution Trace
Here's a step-by-step walkthrough of the logic:

1.  We define a function `swap` that takes two reference parameters `a` and `b`.
2.  In the `main` function, we declare two variables `num1` and `num2` and initialize them with values 5 and 10 respectively.
3.  We print the values of `num1` and `num2` before swapping.
4.  We call the `swap` function, passing `num1` and `num2` as arguments.
5.  Inside the `swap` function, we swap the values of `a` and `b` using a temporary variable.
6.  Since `a` and `b` are reference parameters, the changes made to them directly affect `num1` and `num2`.
7.  We print the values of `num1` and `num2` after swapping.

## 4. The Trap (Edge Case Analysis)
A common pitfall when using reference parameters is forgetting to initialize them with valid variables. If a reference parameter is not initialized, it will result in a compilation error.

Another trap is using reference parameters with temporary variables. For example:

```cpp
void foo(int& a) {
    a = 10;
}

int main() {
    foo(5); // Error: cannot bind non-const reference to a temporary variable
    return 0;
}
```

In this example, we're trying to pass a temporary variable `5` to the `foo` function, which expects a reference parameter. This results in a compilation error.

---

## 5. Question

**Scenario-Based Question**: What happens if a function modifies a reference parameter?

**Implementation Challenge**: A function swaps two numbers using reference parameters. What are the values of the numbers after the function call?

**Socratic Debugger**:

```cpp
void foo(int& a) {
    a = 10;
}

int main() {
    foo(5); // Error: cannot bind non-const reference to a temporary variable
    return 0;
}``` How do you fix this code?


```