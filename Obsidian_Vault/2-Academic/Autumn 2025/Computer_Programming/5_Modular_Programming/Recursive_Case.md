---
title: Recursive Case
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 48
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
The recursive case is a fundamental concept in programming where a function calls itself with modified arguments, moving toward the base case.

## 2. Technical Deep-Dive
In a recursive function, the recursive case is where the function calls itself with modified arguments. This process continues until the function reaches the base case, which is a trivial case that can be solved directly.

## 3. Step-by-Step Visualization
### The Artifact

```cpp
Here's a complete example of a recursive function in C++ that calculates the factorial of a given number: 

```

```cpp
#include <iostream>

// Function to calculate factorial
int factorial(int n) {
    // Base case: 1! = 1
    if (n == 1) {
        return 1;
    }
    // Recursive case: n! = n * (n-1)!
    else {
        return n * factorial(n-1);
    }
}

int main() {
    int num;
    std::cout << \
```


### Logic Walkthrough / Execution Trace
Here's a step-by-step walkthrough of how the `factorial` function works:

1.  The user enters a positive integer `num`.
2.  The `factorial` function is called with `num` as the argument.
3.  If `num` equals 1, the function returns 1 (base case).
4.  If `num` is greater than 1, the function calls itself with `num-1` as the argument (recursive case).
5.  Steps 3-4 continue until `num` equals 1.
6.  The function returns the final result, which is the product of all positive integers up to `num`.

## 4. The Trap (Edge Case Analysis)
A common pitfall in recursive programming is stack overflow. If the recursive function calls itself too many times, it can exceed the maximum stack size, leading to a stack overflow error. To avoid this, ensure that your recursive function has a proper base case and that each recursive call moves closer to the base case.