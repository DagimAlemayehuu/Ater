---
title: Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 10
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
The concept of a recurrence relation can be likened to a game of musical chairs, where each player (term in the sequence) is seated based on the positions of the previous players, and the rules of the game (the recurrence relation) dictate how each player finds their seat. Just as each player must find their seat based on the previous players' positions, each term in the sequence is determined by the values of preceding terms. This analogy highlights the dependency of each term on its predecessors.

# 2. Execution Logic & Data Flow
The execution of a [[Recurrence_Relation]] involves iteratively computing the terms of a [[Sequence]] using previously determined values. This process often begins with an [[Initial_Condition]] that provides the starting point for the iteration. The [[Characteristic_Equation]] of a [[Linear_Homogeneous_Recurrence_Relation]] plays a crucial role in finding the [[General_Solution]], which describes the sequence's behavior. To obtain a [[Unique_Solution]], one must apply the [[Method_Of_Undetermined_Coefficients]] and use the given [[Initial_Condition]] to solve for the constants. The solution is then expressed as a [[Solution_Of_A_Relation]].

# 3. Edge Cases & Failure States
When dealing with recurrence relations, edge cases often arise from improperly defined [[Initial_Condition]]s or inconsistencies in the [[Recurrence_Relation]] itself, leading to a failure in obtaining a [[Unique_Solution]]. If the [[Characteristic_Equation]] has repeated roots, the [[General_Solution]] may not be directly applicable, requiring an alternative approach. Moreover, overlooking the constraints on the domain of the sequence can result in an invalid [[Solution_Of_A_Relation]]. In such cases, re-examining the [[Linear_Homogeneous_Recurrence_Relation]] and its [[Initial_Condition]] is essential to resolve the inconsistencies.
## 4. Implementation Mechanics
```python
def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

# ASCII Memory/Stack Diagram
# +---------------+
# |  fib(n)     |
# +---------------+
# |  n=5         |
# |  calls fib(4) |
# |  and fib(3)  |
# +---------------+
#       |
#       |
#       v
# +---------------+       +---------------+
# |  fib(4)     |       |  fib(3)     |
# +---------------+       +---------------+
# |  n=4         |       |  n=3         |
# |  calls fib(3) |       |  calls fib(2) |
# |  and fib(2)  |       |  and fib(1)  |
# +---------------+       +---------------+
#       |                       |
#       |                       |
#       v                       v
# +---------------+       +---------------+
# |  fib(3)     |       |  fib(2)     |
# +---------------+       +---------------+
# |  n=3         |       |  n=2         |
# |  calls fib(2) |       |  calls fib(1) |
# |  and fib(1)  |       |  and fib(0)  |
# +---------------+       +---------------+
```

The code block represents a recursive implementation of the Fibonacci sequence using a recurrence relation. The ASCII memory/stack diagram illustrates the call stack and the recursive calls made by the `fibonacci` function.

## 5. Walkthrough
1. Initially, we call `fibonacci(5)`, which checks if `n` is less than or equal to 1. Since `n=5` is not, it calls `fibonacci(4)` and `fibonacci(3)`.
2. `fibonacci(4)` calls `fibonacci(3)` and `fibonacci(2)`, while `fibonacci(3)` calls `fibonacci(2)` and `fibonacci(1)`.
3. `fibonacci(2)` calls `fibonacci(1)` and `fibonacci(0)`. At this point, `fibonacci(1)` returns 1 and `fibonacci(0)` returns 0.
4. `fibonacci(2)` returns `fibonacci(1) + fibonacci(0) = 1 + 0 = 1`.
5. `fibonacci(3)` returns `fibonacci(2) + fibonacci(1) = 1 + 1 = 2`.
6. Finally, `fibonacci(5)` returns `fibonacci(4) + fibonacci(3) = 3 + 2 = 5`, which is the 5th Fibonacci number.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {"id":"q1","type":"fill_in","difficulty":"L1","question":"A recurrence relation defines each term in a sequence as a function of the [[Blank1]] terms.","textWithBlanks":"A recurrence relation defines each term in a sequence as a function of the [[Blank1]] terms.","answer":["preceding"],"explanation":"The definition of a recurrence relation involves dependency on previous terms."},
  {"id":"q2","type":"true_false","difficulty":"L2","question":"A recurrence relation can be used to model the number of ways to arrange n distinct objects in a line.","answer":false,"explanation":"This is actually a permutation problem, not a recurrence relation model. Recurrence relations often model sequences with dependencies."},
  {"id":"q3","type":"debug","difficulty":"L3","question":"Find the bug in this code for calculating the nth Fibonacci number using a recurrence relation.","content":"int fib(int n) { if (n <= 1) return n; else return fib(n-1) + fib(n-2); }","answer":"Stack overflow for large n due to repeated computation","explanation":"The code does not store or reuse previously computed Fibonacci numbers, leading to exponential time complexity."}
]
```