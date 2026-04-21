---
title: Recursion
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 46
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
## Explanation

Imagine you're standing in front of a mirror. You see your reflection, and within that reflection, you see another reflection, and another, and another. This can go on forever, but it doesn't. Your reflection eventually ends with the wall behind you or some other boundary. Recursion works similarly. A function calls itself repeatedly until it reaches a boundary condition, known as the base case, that stops the recursion.

## Deep Dive

Recursion is a programming technique where a function calls itself as a subroutine. This allows the function to be repeated several times, since it can call itself during its execution. The recursion depth (the number of times the function calls itself) depends on the termination condition, which is crucial to prevent infinite loops.

### Key Elements of Recursion

*   **Base Case**: A trivial case that can be solved directly, stopping the recursion.
*   **Recursive Case**: A case that can be broken down into a smaller instance of the same problem.

### How Recursion Works

1.  A function `f` calls itself within its definition.
2.  Each call to `f` adds a new layer to the call stack.
3.  The recursion stops when the base case is reached.

### Example: Factorial Function

The factorial of a non-negative integer `n`, denoted by `n!`, is the product of all positive integers less than or equal to `n`.

```cpp
// Recursive function to calculate factorial
int factorial(int n) {
    // Base case
    if (n == 0)
        return 1;
    // Recursive case
    else
        return n * factorial(n - 1);
}
```

### Time and Space Complexity

*   **Time Complexity**: O(n) because the function makes n recursive calls.
*   **Space Complexity**: O(n) due to the recursion stack.

## Artifact

Here's a complete C++ code example demonstrating recursion with a factorial function:

```cpp
#include <iostream>

// Recursive function to calculate factorial
int factorial(int n) {
    // Base case
    if (n == 0)
        return 1;
    // Recursive case
    else
        return n * factorial(n - 1);
}

int main() {
    int number;
    std::cout << "Enter a positive integer: ";
    std::cin >> number;

    if (number < 0) {
        std::cout << "Factorial is not defined for negative numbers." << std::endl;
    } else {
        std::cout << "Factorial of " << number << " = " << factorial(number) << std::endl;
    }

    return 0;
}
```

## Walkthrough

1.  **Understanding the Problem**: The goal is to calculate the factorial of a given non-negative integer using recursion.
2.  **Defining the Base Case**: If `n` equals 0, the function returns 1, as the factorial of 0 is defined to be 1.
3.  **Defining the Recursive Case**: For any positive integer `n`, the function calls itself with the argument `n-1` and multiplies the result by `n`.

## The Trap

A common pitfall in recursion is infinite recursion, which occurs when the base case is not properly defined or is unreachable. For example, if the base case in the factorial function is mistakenly omitted or incorrectly implemented, the function will keep calling itself indefinitely, leading to a stack overflow error.

**Solution**: Ensure that every recursive function has a well-defined base case that can be reached within a finite number of steps.

## Search Keywords

*   Recursion
*   Base case
*   Recursive case
*   Factorial function
*   Stack overflow
*   Infinite recursion
*   C++ programming

```json
{
    "source_pages": []
}
```


## 2. Technical Deep-Dive
FALLBACK: Check raw JSON block in explanation field.

## 3. Step-by-Step Visualization
### The Artifact

```cpp

```


### Logic Walkthrough / Execution Trace


## 4. The Trap (Edge Case Analysis)