---
read: true
---

# 1. Technical Definition
A base case is a terminating condition in a recursive function that prevents infinite recursion by providing a trivial case that can be solved directly, without calling the function again. It is a `conditional statement` that stops the recursion when a specific condition is met, typically when the input data is reduced to a minimal or simplest form.

# 2. Mental Model
Imagine you're in a never-ending hallway with doors that lead to more hallways. A base case is like a door that leads to a room with no more hallways. When you reach that door, you stop walking and go into the room, because there's no more hallway to explore. This helps you avoid getting lost in an infinite loop of hallways.

# 3. Syntax Mechanics
* A base case is typically defined using a `conditional statement` (e.g., if-else).
* It is usually placed at the beginning of a recursive function.
* The base case provides a solution to a trivial or minimal instance of the problem.
* It returns a value or performs an action that stops the recursion.

# 4. Memory Lifecycle
* A base case helps prevent a stack overflow by limiting the number of recursive calls.
* It ensures that the function does not exceed the maximum allowed depth of recursion.
* The base case is typically executed only once, when the recursion is terminated.
* If the base case is not properly defined, the function may exceed the maximum recursion limit and crash.

---

## 5. Worked Example

```cpp
#include <iostream>

// Recursive function to calculate the factorial of a number
int factorial(int n) {
    // Base case: factorial of 0 or 1 is 1
    if (n == 0 || n == 1) {
        return 1;
    } else {
        // Recursive case: n! = n * (n-1)!
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
2. `factorial(5)` calls `factorial(4)` because `5 != 0` and `5 != 1`.
3. `factorial(4)` calls `factorial(3)` because `4 != 0` and `4 != 1`.
4. `factorial(3)` calls `factorial(2)` because `3 != 0` and `3 != 1`.
5. `factorial(2)` calls `factorial(1)`.
6. `factorial(1)` returns `1` because it hits the **base case** (`n == 1`).
7. `factorial(2)` returns `2 * 1 = 2`.
8. `factorial(3)` returns `3 * 2 = 6`.
9. `factorial(4)` returns `4 * 6 = 24`.
10. `factorial(5)` returns `5 * 24 = 120`.
11. The final result, `120`, is printed to the console.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary purpose of a base case in a recursive function?

**Implementation Challenge**: Write a recursive function to calculate the sum of all elements in an array using a base case.

**Debug Challenge**: Find the memory leak/bug in the following recursive function: 
```cpp
int recursiveFunction(int n) {
    if (n > 0) {
        return n + recursiveFunction(n - 1);
    }
}
```

---

### Answer Key
- **L1_SCENARIO**: The primary purpose of a base case is to terminate the recursion by providing a trivial case that can be solved directly.
- **L2_IMPLEMENTATION**: 
```cpp
int recursiveSum(int arr[], int size, int index) {
    // Base case: if index is equal to size, return 0
    if (index == size) {
        return 0;
    } else {
        return arr[index] + recursiveSum(arr, size, index + 1);
    }
}
```
- **L3_DEBUG**: The bug in the given recursive function is that it does not have a proper base case to stop the recursion when `n` reaches 0 or a negative value. This can cause a stack overflow. The corrected function should be:
```cpp
int recursiveFunction(int n) {
    if (n <= 0) { // Base case
        return 0;
    } else {
        return n + recursiveFunction(n - 1);
    }
}
```