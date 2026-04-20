---
title: Base Case
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 47
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
The base case is the simplest case that a function can handle, used to stop the recursion.

## 2. Technical Deep-Dive
In the context of recursive functions, the base case is a crucial component that serves as the termination condition for the recursion. It is a trivial case that can be solved directly, without the need for further recursive calls. The base case provides a stopping point for the recursion, preventing infinite loops and ensuring that the function returns a valid result. In the example code snippet, the base case is when `n` equals 0, in which case the function returns 1. This base case is essential for the correct functioning of the `factorial` function, as it allows the recursion to terminate and the function to return the correct result.

## 3. Step-by-Step Visualization
### The Artifact

```cpp
int factorial(int n) {
    if (n == 0) {
        return 1;
    } else {
        return n * factorial(n-1);
    }
}
```


### Logic Walkthrough / Execution Trace
1. The function `factorial` is called with an integer `n`.
2. If `n` is 0, the function returns 1 (base case).
3. If `n` is not 0, the function calls itself with the argument `n-1` and multiplies the result by `n`.
4. This process repeats until `n` reaches 0, at which point the recursion stops and the function returns the final result.

## 4. The Trap (Edge Case Analysis)
A common pitfall is to forget to include a base case or to define it incorrectly, leading to infinite recursion and potential stack overflow errors. For example, if the base case in the `factorial` function was not defined as `n == 0`, but rather as `n == 1`, the function would not work correctly for `n = 0` and would also lead to incorrect results for other values of `n`.

---

## 5. Question

**Scenario-Based Question**: What happens if a recursive function does not have a base case?

**Implementation Challenge**: What is the base case in the factorial function?

**Socratic Debugger**:

How would you fix the following broken code: ``` int factorial(int n) { if (n == 1) { return 1; } else { return n * factorial(n-1); } } ```?