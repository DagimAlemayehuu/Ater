---
title: Function
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 3
mode: CS-SOFTWARE
read: false
generated: true
prerequisites:
- "[[Functions_In_C++]]"
---

# 1. Mental Model
Imagine you have a recipe book where each recipe is like a set of instructions that takes some ingredients, does something with them, and gives you a specific dish. A function in programming is similar; it's a block of code that takes some inputs, processes them according to a set of instructions, and returns a result. Just as you can use a recipe to make different dishes by changing the ingredients, a function can produce different outputs by changing its inputs.

# 2. Execution Logic & Data Flow
When a function is called, it creates a new [[Stack_Frame]] on the call stack, which serves as a isolated workspace for that function's execution. The function's parameters are [[Passed_By_Value]] or [[Passed_By_Reference]] into this workspace, depending on the programming language's [[Parameter_Passing_Mode]]. The function's body then executes, using these parameters and any [[Local_Variables]] it declares, until it reaches a return statement, at which point it [[Returns]] a value to the caller and its stack frame is destroyed.

# 3. Edge Cases & Failure States
Functions can encounter several edge cases and failure states, such as being called with [[Invalid_Arguments]], which can lead to runtime errors if not properly handled. A function may also exceed its [[Maximum_Recursion_Depth]] if it calls itself too many times without terminating, causing a stack overflow. Additionally, if a function does not explicitly return a value, it may [[Return_Null]] or a default value, depending on the programming language's [[Return_Type]] rules. Proper error handling and input validation are crucial to mitigate these issues.
# 4. Implementation Mechanics
```python
def add_numbers(a, b):
    """
    Adds two numbers and returns the result.

    Args:
        a (int): The first number.
        b (int): The second number.

    Returns:
        int: The sum of a and b.
    """
    result = a + b
    return result
```
To read this code block: This is a Python function named `add_numbers` that takes two parameters, `a` and `b`, adds them together, and returns the result. The function includes a docstring that provides a description of what the function does, its parameters, and its return value.

## 5. Walkthrough
Here's a step-by-step walkthrough of how the `add_numbers` function works:

1. The function is called with two arguments, `5` and `10`, like this: `add_numbers(5, 10)`.
2. A new stack frame is created for the function, and the parameters `a` and `b` are assigned the values `5` and `10`, respectively.
3. The function body executes, adding `a` and `b` together and storing the result in the `result` variable: `result = 5 + 10 = 15`.
4. The function reaches the return statement and returns the value of `result`, which is `15`.
5. The stack frame is destroyed, and the returned value is passed back to the caller.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "A function in programming is similar to a [[Blank1]] where you can change the [[Blank2]] to get different outputs.",
    "textWithBlanks": "A function in programming is similar to a [[Blank1]] where you can change the [[Blank2]] to get different outputs.",
    "answer": [
      "recipe",
      "ingredients"
    ],
    "explanation": "This question tests the understanding of the mental model of a function."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "When a function is called, it creates a new stack frame on the call stack.",
    "answer": "True",
    "explanation": "This question tests the understanding of the execution logic and data flow of a function."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code:",
    "content": "def add_numbers(a, b):\n  result = a + c\n  return result",
    "answer": "The bug is that the variable 'c' is not defined. It should be 'b' instead.",
    "explanation": "This question tests the ability to debug a function and identify the cause of an error."
  }
]
```