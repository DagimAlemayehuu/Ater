---
title: Base Case
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
## Explanation

Imagine you're solving a problem that can be broken down into smaller versions of itself. A base case is like a stopping point that tells your solution when to stop breaking down the problem and start solving it. Without a base case, your solution might keep breaking down the problem infinitely.

## Deep Dive

In recursive solutions, a `base case` is a crucial component that prevents infinite recursion. Recursion is a programming technique where a function calls itself repeatedly until it reaches a `base case` that stops the recursion. The `base case` is a trivial case that can be solved directly, and it serves as a termination condition for the recursion.

### Characteristics of a Base Case

*   It is a simple case that can be solved directly.
*   It stops the recursion, preventing infinite calls.
*   It provides a starting point for the recursion to unwind.

### Example: Factorial Function

The factorial function is a classic example of recursion. The function calculates the product of all positive integers up to a given number `n`.

```cpp
int factorial(int n) {
    // Base case: factorial of 0 or 1 is 1

| if (n == 0 |  | n == 1) { |
| --- | --- | --- |

        return 1;
    }
    // Recursive case: n! = n * (n-1)!
    else {
        return n * factorial(n-1);
    }
}
```

In this example, the `base case` is when `n` is 0 or 1. When `n` reaches 0 or 1, the function returns 1, stopping the recursion.

## Artifact

Here is a complete, working C++ code block that demonstrates a recursive function with a `base case`:

```cpp
#include <iostream>

// Recursive function to calculate the factorial of a number
int factorial(int n) {
    // Base case: factorial of 0 or 1 is 1

| if (n == 0 |  | n == 1) { |
| --- | --- | --- |

        return 1;
    }
    // Recursive case: n! = n * (n-1)!
    else {
        return n * factorial(n-1);
    }
}

int main() {
    int num;
    std::cout << "Enter a positive integer: ";
    std::cin >> num;

    if (num < 0) {
        std::cout << "Factorial is not defined for negative numbers." << std::endl;
    }
    else {
        int result = factorial(num);
        std::cout << "Factorial of " << num << " = " << result << std::endl;
    }

    return 0;
}
```

## Walkthrough

Here's a step-by-step walkthrough of the logic:

1.  The user is prompted to enter a positive integer.
2.  The `factorial` function is called with the user's input.
3.  The `factorial` function checks if the input `n` is 0 or 1 (the `base case`).
4.  If `n` is 0 or 1, the function returns 1, stopping the recursion.
5.  If `n` is greater than 1, the function calls itself with `n-1` until it reaches the `base case`.
6.  The results of each recursive call are multiplied together to calculate the final factorial.

## The Trap

A common pitfall when implementing recursive functions is to forget or incorrectly implement the `base case`. This can lead to a stack overflow error due to infinite recursion.

For example, consider the following incorrect implementation:

```cpp
int factorial(int n) {
    // Incorrect base case: missing condition for n == 1
    if (n == 0) {
        return 1;
    }
    else {
        return n * factorial(n-1);
    }
}
```

In this example, if the user inputs 1, the function will call itself infinitely, leading to a stack overflow error.

## Search Keywords

*   Base case
*   Recursion
*   Factorial function
*   Infinite recursion
*   Stack overflow error
*   Recursive function
*   Termination condition

## 2. Technical Deep-Dive
FALLBACK: Check raw JSON block in explanation field.

## 3. Step-by-Step Visualization
### The Artifact

```cpp

```


### Logic Walkthrough / Execution Trace


## 4. The Trap (Edge Case Analysis)