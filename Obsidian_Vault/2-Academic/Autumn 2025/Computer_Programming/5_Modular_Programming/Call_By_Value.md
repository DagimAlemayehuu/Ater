---
title: Call_by_Value
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 44
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you have a toy box where you keep your favorite toy, a red ball. When you give a copy of the ball to your friend, you're not giving them the box or the ability to directly change the ball in your box. They can only play with their own copy. In programming, "Call by Value" works similarly, where a copy of the original value is passed to a function, and any changes made by the function affect only the copy, not the original.

# 2. Execution Logic & Data Flow
In Call by Value, when a function is invoked, a copy of the actual parameter's value is created and passed to the function. This copy is stored in a [[Stack_Frame]], which is a region of memory that stores information about the active subroutines of a program. The function then operates on this copy, and any changes made are confined to this [[Stack_Frame]]. The original value remains unchanged in its memory location. The [[Parameter_Passing]] mechanism involves the creation of a [[Temporary_Variable]] to hold the copied value. The function's [[Local_Variables]] and operations are performed on this copied value, ensuring that the original data remains intact.

# 3. Edge Cases & Failure States
In Call by Value, boundary conditions arise when dealing with [[Immutable_Objects]] and [[Primitive_Types]], where changes within the function are not possible or do not affect the original. However, passing large [[Composite_Data_Types]] by value can be inefficient due to the overhead of copying. Failure states can occur if the function attempts to modify the original data through a mistaken assumption that the changes will be reflected outside the function. Constraints include the potential for [[Data_Inconsistency]] if not properly managed, and [[Performance_Optimization]] considerations when dealing with large data sets. The [[Scope_Resolution]] mechanism ensures that the changes are localized, preventing unintended side effects on the original data.
# 4. Implementation Mechanics
```python
def modify_value(x):
    x = x + 10
    return x

original_value = 5
print("Original Value:", original_value)

modified_value = modify_value(original_value)
print("Modified Value:", modified_value)
print("Original Value after modification:", original_value)
```
To read this: The code defines a function `modify_value` that increments its input by 10. We then demonstrate the function's effect on an `original_value`, showing that the modification occurs independently of the original.

## 5. Walkthrough
Here's a step-by-step walkthrough of the concept applied to a realistic scenario:

1. **Initial State**: We have a variable `original_value` with a value of 5 stored in memory location `0x1000`.
2. **Function Invocation**: We call `modify_value(original_value)`, which creates a copy of `original_value`, let's say `0x1001` contains the value 5.
3. **Copy Creation**: A new memory location, say `0x2000`, is allocated for the function's local variable `x`, and the value 5 is copied into it.
4. **Modification**: Within the function, `x` is incremented by 10, so `x` becomes 15. This change only affects the local copy at `0x2000`.
5. **Return**: The function returns the modified value, 15, which is stored in `modified_value`.
6. **Cleanup**: The function's local memory is deallocated, including the copy of the value at `0x2000`.
7. **Final State**: The `original_value` remains unchanged at 5 in memory location `0x1000`, while `modified_value` is 15.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "In Call by Value, when a function is invoked, a copy of the [[Blank1]] is created and passed to the function.",
    "textWithBlanks": "In Call by Value, when a function is invoked, a copy of the [[Blank1]] is created and passed to the function.",
    "answer": [
      "actual parameter's value"
    ],
    "explanation": "This tests recall of the definition of Call by Value."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "In Call by Value, changes made by the function affect the original value.",
    "answer": "False",
    "explanation": "This tests application of Call by Value to a new scenario."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code.",
    "content": "def calculate_sum(a, b):\n  a = a + b\n  return a\n\nx = 5\ny = 10\nresult = calculate_sum(x, y)\nprint(result)\nprint(x)",
    "answer": "The bug is not actually a bug; the code works as expected in Call by Value. However, if the intention was to modify x, then the issue is that the change is not reflected outside the function.",
    "explanation": "This tests debugging or execution in a complex realistic case."
  }
]
```