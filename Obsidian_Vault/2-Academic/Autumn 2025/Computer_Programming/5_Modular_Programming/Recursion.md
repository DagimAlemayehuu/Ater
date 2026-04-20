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
Recursion is a programming concept where a function calls itself repeatedly until it reaches a base case that stops the recursion. Think of it like a set of Russian nesting dolls, where each doll is a smaller version of the same problem, until you reach the smallest doll that can't be nested further.

## 2. Technical Deep-Dive
Recursion is a fundamental concept in computer science, and it's essential to understand how it works. When a function calls itself, it creates a new stack frame, which consumes memory on the call stack. The function then executes until it reaches a base case, at which point it starts returning values back up the call stack. 

In C++, a recursive function typically has two essential components:

1. **Base case**: A trivial case that can be solved directly, stopping the recursion.
2. **Recursive case**: A case that breaks down the problem into a smaller sub-problem, which is then solved by calling the same function.

Here's an example of a recursive function in C++ that calculates the factorial of a given `int`:

```cpp
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

Recursion can be an efficient way to solve problems that have a recursive structure, but it can also lead to stack overflows if the recursion is too deep. To mitigate this, some compilers optimize tail recursion, which allows the function to reuse the current stack frame for the recursive call.

In terms of memory management, recursive functions use stack memory to store the function call stack. Each recursive call adds a new layer to the stack, which can lead to stack overflows if not managed properly. 

To illustrate this, consider the following example:
```

```cpp
void recursiveFunction(int n) {
  int x = 10; // allocated on the stack
  if (n > 0) {
    recursiveFunction(n-1); // new stack frame
  }
}

In this example, each recursive call creates a new stack frame, which allocates memory for the local variable `x`. If the recursion is too deep, the stack will overflow, leading to a runtime error.

To avoid stack overflows, it's essential to ensure that the recursive function has a proper base case and that the recursive calls are not too deep.
```

## 3. Step-by-Step Visualization
### The Artifact

```cpp

```


### Logic Walkthrough / Execution Trace


## 4. The Trap (Edge Case Analysis)

---

## 5. Question

**Scenario-Based Question**: What happens if a recursive function in C++ does not have a base case?

**Implementation Challenge**: Write a recursive function in C++ to calculate the factorial of a given integer.

**Socratic Debugger**:

Fix the following broken code block:
```cpp
int factorial(int n) {
  // Recursive case: n! = n * (n-1)!
  return n * factorial(n-1);
}
```