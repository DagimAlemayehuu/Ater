---
title: Call_by_Reference
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 40
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you have a friend who wants to borrow a book from you. Instead of giving your friend a copy of the book, you give them the address of where the book is kept in your house. If your friend makes any changes to the book, they are actually changing the original book in your house. This is similar to how `call by reference` works, where a function receives the address of the original variable, allowing it to modify the original variable directly.

# 2. Execution Logic & Data Flow
In `call by reference`, when a function is invoked, the [[Address_Of_Operator]] is used to obtain the memory address of the actual parameter, which is then passed to the function. The formal parameter is essentially a reference, or alias, for the actual parameter. The function operates on the original variable by dereferencing the address stored in the [[Stack_Frame]]. Any modifications made to the formal parameter within the function affect the original variable in the [[Caller_Scope]]. The [[Parameter_Passing_Mode]] is critical in determining whether the changes are persisted after the function returns.

# 3. Edge Cases & Failure States
In `call by reference`, passing an [[Lvalue]] is required, as the function needs to store the address of the variable. If an [[Rvalue]] is passed, a compiler error occurs, as the address of a temporary value cannot be taken. Additionally, [[Dangling_Pointer]] issues can arise if the referenced variable goes out of scope or is deallocated while the reference is still valid. Furthermore, [[Aliasing]] can lead to unexpected behavior if the same variable is modified through multiple references. Care must be taken to ensure that the referenced variable remains valid throughout the function's execution.
# 4. Implementation Mechanics
```python
def swap_by_reference(a_ref, b_ref):
    # Dereference the references to get the values
    a = a_ref[0]
    b = b_ref[0]
    
    # Swap the values
    temp = a
    a = b
    b = temp
    
    # Update the original variables through the references
    a_ref[0] = a
    b_ref[0] = b

# Example usage
a = 5
b = 10

print("Before swap: a =", a, ", b =", b)

# Pass the addresses of a and b as a list (simulating call by reference)
swap_by_reference([a], [b])

print("After swap: a =", a, ", b =", b)
```
To read this code snippet: The `swap_by_reference` function takes two lists, each containing a single element, which simulates passing by reference. The function swaps the values of the two variables and updates the original variables through the references.

## 5. Walkthrough
Here's a step-by-step walkthrough of the `swap_by_reference` function:

1. Initially, `a = 5` and `b = 10`.
2. The `swap_by_reference` function is called with `a` and `b` passed as lists: `swap_by_reference([a], [b])`.
3. Inside the function, `a_ref[0] = 5` and `b_ref[0] = 10`.
4. The values are swapped: `a = 10` and `b = 5`.
5. The original variables are updated through the references: `a_ref[0] = 10` and `b_ref[0] = 5`.
6. After the function returns, `a = 10` and `b = 5`, demonstrating that the swap was successful.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "In call by reference, the function receives the [[Blank1]] of the original variable.",
    "textWithBlanks": "In call by reference, the function receives the [[Blank1]] of the original variable.",
    "answer": [
      "address"
    ],
    "explanation": "The function receives the address of the original variable in call by reference."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "In call by reference, passing an rvalue will result in a compiler error.",
    "answer": "True",
    "explanation": "Passing an rvalue in call by reference results in a compiler error because the address of a temporary value cannot be taken."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the implementation of the swap_by_reference function.",
    "content": "def swap_by_reference(a, b):\n    temp = a\n    a = b\n    b = temp",
    "answer": "The function is not modifying the original variables because it's not using call by reference correctly. The parameters 'a' and 'b' should be references to the original variables.",
    "explanation": "The given implementation does not use call by reference, resulting in no change to the original variables."
  }
]
```