# 1. Technical Definition
A recursive case is a problem-solving approach where a function `divides` a complex problem into smaller sub-problems of the same type, which are then solved by the same function, until it reaches a `base-case` that can be solved directly. The recursive case is a crucial component of recursive algorithms, allowing them to tackle complex problems by breaking them down into more manageable pieces.

# 2. Mental Model
Imagine you have a big puzzle with many pieces, and you need to put it together. Instead of trying to put the whole puzzle together at once, you break it down into smaller sections, and then break those sections down into even smaller pieces. You keep doing this until you have individual puzzle pieces that can be easily put together, and then you work your way back up, combining the smaller sections into larger ones until the whole puzzle is complete.

# 3. Syntax Mechanics
* A recursive function calls itself with a smaller input or a modified version of the original input.
* The function divides the problem into smaller sub-problems, which are then solved by the same function.
* The recursive case is typically implemented using a conditional statement that checks for the `base-case`.
* The function converges on the `base-case`, at which point it stops calling itself and starts returning solutions back up the call stack.

# 4. Memory Lifecycle
* Each recursive call adds a new layer to the call stack, which consumes memory.
* The call stack has a limited size, and excessive recursion can lead to a stack overflow error.
* The recursive function uses memory to store the state of each sub-problem, which can lead to increased memory usage.
* The function releases memory as it returns from each recursive call, eventually freeing up memory as it converges on the `base-case`.

---

## 5. Worked Example

```cpp
#include <iostream>

int factorial(int n) {
    // Base case
    if (n == 0) {
        return 1;
    }
    // Recursive case
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
2. `factorial(5)` calls `factorial(4)` because `n` is not equal to 0.
3. This process continues until `factorial(0)` is called, which returns 1 (the base case).

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary purpose of the base case in a recursive function?

**Implementation Challenge**: How would you implement a recursive function to calculate the sum of all elements in an array?

**Debug Challenge**: Find the memory leak/bug in the given code and explain how it can be fixed.

---

### Answer Key
* L1_SCENARIO: The primary purpose of the base case in a recursive function is to provide a stopping condition that allows the function to stop calling itself and start returning solutions back up the call stack.
* L2_IMPLEMENTATION: A recursive function to calculate the sum of all elements in an array could be implemented by dividing the array into smaller sub-arrays, summing each sub-array recursively, and then combining the results. For example:
```cpp
int sumArray(int arr[], int size) {
    // Base case
    if (size == 1) {
        return arr[0];
    }
    // Recursive case
    else {
        return arr[0] + sumArray(arr + 1, size - 1);
    }
}
```
* L3_DEBUG: There is no memory leak in the given code. However, a potential bug is that the function does not handle negative input values. Factorial is only defined for non-negative integers. To fix this, you could add a check at the beginning of the function to handle negative input values. For example:
```cpp
int factorial(int n) {
    if (n < 0) {
        throw std::invalid_argument("Factorial is not defined for negative numbers");
    }
    // Base case
    if (n == 0) {
        return 1;
    }
    // Recursive case
    else {
        return n * factorial(n - 1);
    }
}
```