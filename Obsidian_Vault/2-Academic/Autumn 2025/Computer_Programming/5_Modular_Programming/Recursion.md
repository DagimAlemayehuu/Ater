# 1. Technical Definition
Recursion is a programming concept where a function calls itself repeatedly until it reaches a base case that stops the recursion. A recursive function is defined with `recursive calls` that solve a problem by breaking it down into smaller instances of the same problem.

# 2. Mental Model
Imagine you have a set of Russian nesting dolls. To open all the dolls, you would open the largest one, then open the one inside it, and keep opening the ones inside until you reach the smallest doll. This is similar to how recursion works: a problem is broken down into smaller versions of itself until it reaches a simple case that can be solved directly.

# 3. Syntax Mechanics
* A recursive function must have a base case that stops the recursion.
* A recursive function calls itself with a smaller input or a modified version of the original input.
* The function must make progress towards the base case with each recursive call.
* Recursive functions can be less efficient than iterative solutions due to the overhead of function calls.

# 4. Memory Lifecycle
* Each recursive call adds a layer to the call stack, consuming memory.
* The call stack has a limited size, and excessive recursion can lead to a stack overflow error.
* The base case is crucial in preventing infinite recursion and stack overflow errors.
* When the base case is reached, the function starts returning and the call stack is gradually cleared.

---

## 5. Worked Example

```cpp
#include <iostream>

int factorial(int n) {
    // Base case
    if (n == 0) {
        return 1;
    }
    // Recursive call
    else {
        return n * factorial(n - 1);
    }
}

int main() {
    int num = 5;
    std::cout << "Factorial of " << num << " is: " << factorial(num) << std::endl;
    return 0;
}
```

### Execution Walkthrough
1. The `main` function calls `factorial(5)`.
2. `factorial(5)` calls `factorial(4)`, which calls `factorial(3)`, and so on, until `factorial(0)` is called.
3. `factorial(0)` returns `1` (base case), and then each recursive call returns the product of `n` and the result of the recursive call.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the output of the given C++ code that calculates the factorial of a number using recursion?

**Implementation Challenge**: Write a recursive function to calculate the sum of all elements in an array.

**Debug Challenge**: Find the memory leak/bug in the given recursive function: `int recursiveFunction(int n) { if (n > 0) { recursiveFunction(n - 1); } return n; }`.

---

### Answer Key
* L1_SCENARIO: The output of the given C++ code is: `Factorial of 5 is: 120`.
* L2_IMPLEMENTATION: A possible implementation is: 
```cpp
int recursiveSum(int arr[], int n) {
    // Base case
    if (n == 1) {
        return arr[0];
    }
    // Recursive call
    else {
        return arr[0] + recursiveSum(arr + 1, n - 1);
    }
}
```
* L3_DEBUG: The given recursive function does not have a base case when `n` is less than or equal to `0`, which can lead to a stack overflow error. A fixed version would be: 
```cpp
int recursiveFunction(int n) {
    if (n <= 0) { // Base case
        return 0;
    } else {
        return n + recursiveFunction(n - 1);
    }
}
```