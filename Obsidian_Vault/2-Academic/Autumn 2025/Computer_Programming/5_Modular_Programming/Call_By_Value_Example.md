---
title: Call_by_Value_Example
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 43
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you have two toy boxes, one with a red ball and the other with a blue ball. If you want to swap the balls, but you can only play with copies of the balls, you can't actually swap the balls in the boxes. This is similar to how `call by value` works, where a function receives a copy of the original value, not the original value itself.

# 2. Execution Logic & Data Flow
In the given `swap` function, when it is called with two integer arguments, a new [[Stack_Frame]] is created to store the function's local variables. The values of the arguments are [[Pass_By_Value|Passed By Value]], meaning that `a` and `b` receive copies of the original values. The function then performs the swap operation on these local copies. The [[Assignment_Operator]] is used to assign the value of `a` to `hold`, then the value of `b` to `a`, and finally the value of `hold` (which is the original value of `a`) to `b`. However, these changes only affect the local [[Variables]], not the original variables passed to the function.

# 3. Edge Cases & Failure States
The `swap` function will not actually swap the values of the original variables outside the function because it operates on local copies of the values. This can lead to unexpected behavior if the caller of the function expects the swap to be performed on the original variables. For example, if you call `swap(x, y)`, the values of `x` and `y` will remain unchanged after the function returns. Additionally, the function does not perform any [[Error_Handling]] or [[Input_Validation]], so it assumes that the inputs are always valid integers. The function also does not check for [[Integer_Overflow]], which could potentially occur if the values being swapped are very large.
# 4. Implementation Mechanics
```python
def swap(a, b):
    hold = a
    a = b
    b = hold
    return a, b

x = 5
y = 10
print("Before swap: x =", x, ", y =", y)

a, b = swap(x, y)
print("After swap: x =", x, ", y =", y, ", a =", a, ", b =", b)
```
This code demonstrates the `swap` function in action. The `swap` function takes two values, `a` and `b`, and swaps them, but the changes are only local to the function.

To read this code: The `swap` function is defined with two parameters, `a` and `b`. Inside the function, a temporary variable `hold` is used to facilitate the swap. The function then returns the swapped values. The main part of the code calls `swap` with `x` and `y`, and prints the values before and after the swap.

## 5. Walkthrough
Here's a step-by-step walkthrough of what happens when we call `swap(x, y)`:

1. `x` and `y` are initialized to `5` and `10`, respectively.
2. The `swap` function is called with `x` and `y` as arguments. This creates a new stack frame for the function, and `a` and `b` are assigned copies of the values of `x` and `y`, respectively. So, `a` is `5` and `b` is `10`.
3. Inside the `swap` function, `hold` is assigned the value of `a`, which is `5`.
4. Then, `a` is assigned the value of `b`, which is `10`.
5. Next, `b` is assigned the value of `hold`, which is `5`.
6. The `swap` function returns the swapped values, `10` and `5`, which are assigned to `a` and `b` in the main part of the code.
7. However, the original values of `x` and `y` remain unchanged, still `5` and `10`, respectively.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "In call by value, a function receives a [[Blank1]] of the original value.",
    "textWithBlanks": "In call by value, a function receives a [[Blank1]] of the original value.",
    "answer": [
      "copy"
    ],
    "explanation": "Call by value involves passing a copy of the original value to the function."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "The swap function changes the original values of x and y.",
    "answer": "False",
    "explanation": "The swap function operates on local copies of the values, so it does not change the original values of x and y."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code.",
    "content": "def add(a, b):\n  a = a + 1\n  return b",
    "answer": "The function is supposed to add a and b, but it increments a instead of adding a and b, and returns b instead of the sum.",
    "explanation": "The correct implementation should be 'return a + b'."
  }
]
```