---
title: Recursive_Definition
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 9
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
The concept of a recursive definition can be likened to a set of Russian nesting dolls, where each doll is defined in terms of a smaller version of itself, with the smallest doll serving as the base case that stops the recursion. This self-referential definition allows for a compact and elegant description of a sequence or function. Just as the Russian doll's size and design are defined recursively, a recursive definition in mathematics or computer science defines a problem or function in terms of smaller instances of the same problem.

# 2. Execution Logic & Data Flow
The execution of a [[Recursive_Definition]] involves applying a rule that expresses the current value of a sequence or function in terms of its previous values, as specified by a [[Recurrence_Relation]]. This process continues until it reaches a base case defined by an [[Initial_Condition]], at which point the recursion stops and the results are propagated back up the sequence. The [[Characteristic_Equation]] of a [[Linear_Homogeneous_Recurrence_Relation]] can be used to find the [[General_Solution]], which describes the overall behavior of the sequence. To obtain a [[Unique_Solution]], one must apply the [[Method_Of_Undetermined_Coefficients]] and use the given [[Initial_Condition]] to determine the constants of the general solution. The solution is then obtained through the [[Solution_Of_A_Relation]], which may involve a [[Sequence]] of operations.

# 3. Edge Cases & Failure States
When dealing with recursive definitions, it is crucial to handle edge cases and failure states properly, as the absence of a well-defined [[Initial_Condition]] can lead to an infinite recursion or ambiguous results. If the [[Characteristic_Equation]] has repeated roots, the [[Method_Of_Undetermined_Coefficients]] may need to be modified to ensure a [[Unique_Solution]]. Failure to account for these edge cases can result in a flawed [[Solution_Of_A_Relation]], rendering the recursive definition useless. Furthermore, an improperly defined [[Recurrence_Relation]] can lead to an incorrect [[General_Solution]], highlighting the need for careful analysis and validation.
## 4. Implementation Mechanics
```python
def factorial(n: int) -> int:
    if n == 0:  # base case
        return 1
    else:
        return n * factorial(n-1)  # recursive call
```
```
  +---------------+
  |  Stack Frame  |
  +---------------+
  |  n=3          |
  |  return addr  |
  +---------------+
           |
           |
           v
  +---------------+
  |  Stack Frame  |
  +---------------+
  |  n=2          |
  |  return addr  |
  +---------------+
           |
           |
           v
  +---------------+
  |  Stack Frame  |
  +---------------+
  |  n=1          |
  |  return addr  |
  +---------------+
           |
           |
           v
  +---------------+
  |  Stack Frame  |
  +---------------+
  |  n=0          |
  |  return 1     |
  +---------------+
```

The code block represents the recursive function `factorial` implemented in Python, where each call to `factorial` creates a new stack frame. The ASCII diagram illustrates the stack frames created during the recursive calls, with each frame containing the current value of `n` and the return address.

## 5. Walkthrough
1. Initially, we call `factorial(3)`, which creates a stack frame with `n=3` and a return address. The function calls `factorial(2)`.
2. The call to `factorial(2)` creates a new stack frame with `n=2` and a return address. The function then calls `factorial(1)`.
3. The call to `factorial(1)` creates another stack frame with `n=1` and a return address. The function then calls `factorial(0)`.
4. The call to `factorial(0)` creates a stack frame with `n=0`, which is the base case. The function returns `1`.
5. The return value of `1` is passed back to the stack frame with `n=1`, which then returns `1 * 1 = 1`.
6. The return value of `1` is passed back to the stack frame with `n=2`, which then returns `2 * 1 = 2`, and finally, the stack frame with `n=3` returns `3 * 2 = 6`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {"id":"q1","type":"fill_in","difficulty":"L1","question":"A recursive definition is similar to a set of Russian nesting dolls, where each doll is defined in terms of a [[Blank1]] version of itself.","textWithBlanks":"A recursive definition is similar to a set of Russian nesting dolls, where each doll is defined in terms of a [[Blank1]] version of itself.","answer":["smaller"],"explanation":"This highlights the self-referential nature of recursive definitions."},
  {"id":"q2","type":"true_false","difficulty":"L2","question":"A recursive function must always have a base case that is an edge case.","answer":false,"explanation":"While it's common for recursive functions to have a base case that handles an edge case, it's not a requirement for the base case to be an edge case specifically, but rather a case that stops the recursion."},
  {"id":"q3","type":"debug","difficulty":"L3","question":"Find bug.","content":"int factorial(int n) { if (n == 0) return 1; else return n * factorial(n-1); }","answer":"The function does not handle the case when n is negative.","explanation":"The function should either handle or explicitly disallow negative inputs to prevent incorrect results or a stack overflow."}
]
```