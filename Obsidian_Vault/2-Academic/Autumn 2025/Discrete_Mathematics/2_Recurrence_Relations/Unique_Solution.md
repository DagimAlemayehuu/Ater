---
title: Unique_Solution
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 15
mode: CS-SOFTWARE
read: false
generated: true
prerequisites:
- "[[General_Solution]]"
---

# 1. Mental Model
The concept of a unique solution can be likened to a master key in a musical composition, where the recurrence relation serves as the musical score and the initial conditions are the specific notes to be played at the beginning. Just as a master key uniquely unlocks a specific door, a unique solution uniquely satisfies the recurrence relation with a particular set of initial conditions. This analogy highlights the precise and singular nature of the solution.

# 2. Execution Logic & Data Flow
The process of finding a [[Unique_Solution]] involves using the [[Method_Of_Undetermined_Coefficients]] to solve a [[Linear_Homogeneous_Recurrence_Relation]], which is often represented by a [[Recurrence_Relation]]. This method relies on finding the [[General_Solution]] to the homogeneous relation and then applying the [[Initial_Condition]] to determine the [[Sequence]] that satisfies the relation. The [[Characteristic_Equation]] plays a crucial role in determining the form of the general solution. By solving the characteristic equation, one can derive the general solution and subsequently apply the initial conditions to obtain the unique solution. The [[Solution_Of_A_Relation]] is then verified to ensure it satisfies the original recurrence relation.

# 3. Edge Cases & Failure States
When dealing with a [[Unique_Solution]], it is essential to consider the [[Initial_Condition]] that guarantees a singular solution. If the initial conditions are not properly specified or are inconsistent, the solution may not be unique or may not exist. In cases where the [[Recurrence_Relation]] is not linear or homogeneous, the method of undetermined coefficients may not apply, leading to a failure in finding a unique solution. Furthermore, if the [[Characteristic_Equation]] has repeated roots, special care must be taken to ensure that the solution is correctly formulated.
## 4. Implementation Mechanics
```python
def find_unique_solution(recurrence_relation, initial_conditions):
    """
    Find a unique solution to a recurrence relation given initial conditions.

    Args:
    recurrence_relation (function): A function representing the recurrence relation.
    initial_conditions (list): A list of initial conditions.

    Returns:
    list: A list representing the unique solution.
    """
    solution = [0] * len(initial_conditions)
    solution[0] = initial_conditions[0]

    for i in range(1, len(initial_conditions)):
        solution[i] = recurrence_relation(solution[i-1], initial_conditions[i])

    return solution

# Example usage
def example_recurrence_relation(prev_term, curr_term):
    return prev_term + curr_term

initial_conditions = [2, 3]
unique_solution = find_unique_solution(example_recurrence_relation, initial_conditions)
print(unique_solution)
```

Memory/Stack Diagram:
```
+---------------+
|  solution    |
|  (list)      |
+---------------+
|  [2, 0, 0]   |
+---------------+
       |
       |
       v
+---------------+
|  recurrence  |
|  relation    |
|  (function)  |
+---------------+
       |
       |
       v
+---------------+
|  initial     |
|  conditions  |
|  (list)      |
+---------------+
       |
       |
       v
+---------------+
|  example     |
|  recurrence  |
|  relation    |
+---------------+
```

The code block represents the implementation of a function that finds a unique solution to a recurrence relation given initial conditions. The memory/stack diagram shows the memory layout of the variables and data structures used in the function, with arrows indicating the flow of data between them.

## 5. Walkthrough
1. The function `find_unique_solution` is called with an example recurrence relation and initial conditions `[2, 3]`.
2. The solution list is initialized with zeros, and the first term is set to the first initial condition, so `solution` becomes `[2, 0]`.
3. The function then enters a loop, where it calculates the second term using the recurrence relation and the first term, so `solution` becomes `[2, 5]`.
4. Since there are only two initial conditions, the loop ends, and the function returns the unique solution `[2, 5]`.
5. The example recurrence relation `example_recurrence_relation` is defined as the sum of the previous term and the current term.
6. The unique solution `[2, 5]` is printed to the console, representing the singular solution that satisfies the recurrence relation with the given initial conditions.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {"id":"q1","type":"fill_in","difficulty":"L1","question":"A [[Blank1]] solution to a recurrence relation is one that satisfies the relation and has a specific set of initial conditions.","textWithBlanks":"A [[Blank1]] solution to a recurrence relation is one that satisfies the relation and has a specific set of initial conditions.","answer":["unique"],"explanation":"This type of solution is precise and singular in nature."},
  {"id":"q2","type":"true_false","difficulty":"L2","question":"A homogeneous recurrence relation can have a unique solution with non-homogeneous initial conditions.","answer":false,"explanation":"A homogeneous recurrence relation requires homogeneous initial conditions to produce a unique solution."},
  {"id":"q3","type":"debug","difficulty":"L3","question":"Find bug.","content":"function findUniqueSolution(n) { let solution = 0; for (let i = 0; i <= n; i++) { solution = solution + i; } return solution; }","answer":"The function does not correctly implement a unique solution to a recurrence relation. It seems to be calculating the sum of numbers from 0 to n instead.","explanation":"The given function appears to calculate a cumulative sum rather than solving a recurrence relation. A correct approach would involve defining the recurrence relation and initial conditions, then iteratively or recursively solving for the specific case of n."}
]
```