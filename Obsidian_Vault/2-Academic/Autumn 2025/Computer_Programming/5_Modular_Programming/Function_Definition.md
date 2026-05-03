---
title: Function_Definition
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 8
mode: CS-SOFTWARE
read: false
generated: true
prerequisites:
- "[[Function_Prototypes]]"
---

# 1. Mental Model
Imagine you're ordering food at a restaurant. You tell the waiter what you want, and they take that information to the kitchen staff. A function definition is like writing down the recipe for the kitchen staff (the compiler) to follow when preparing your food (executing the function). It outlines what ingredients (inputs) are needed, what steps to take (the function's body), and what to serve back (the return value).

# 2. Execution Logic & Data Flow
When a function is defined, it creates a [[Function_Signature]] that includes the function's name, [[Parameter_List]], and [[Return_Type]]. The function's body, enclosed in curly brackets, contains the [[Executable_Code]] that gets run when the function is called. The [[Call_Stack]] manages function calls, creating a new [[Stack_Frame]] for each invocation, which includes space for local variables and the function's [[Return_Address]]. When the function finishes executing, its stack frame is popped, and control returns to the caller.

# 3. Edge Cases & Failure States
Function definitions must adhere to specific [[Syntax_Rules]] and [[Semantic_Rules]] to avoid [[Compiler_Errors]]. For example, a function can't be defined with duplicate parameter names, and its return type must match the type of the [[Return_Statement]]. If a function is called with incorrect [[Argument_Types]] or an insufficient number of arguments, it may lead to [[Type_Errors]] or [[Runtime_Errors]]. Additionally, functions with [[Recursive_Calls]] must have a proper base case to avoid [[Stack_Overflow_Errors]].
# 4. Implementation Mechanics
```python
def greet(name: str) -> str:
    # Executable code block
    message = "Hello, " + name + "!"
    return message
```
This code defines a function named `greet` that takes a string parameter `name` and returns a greeting message. To read this, note that `def` is the keyword for defining a function, followed by the function name `greet`, a parameter list `(name: str)`, and a return type hint `-> str`. The function's body is indented and contains a single statement that constructs and returns a greeting message.

## 5. Walkthrough
Let's walk through a scenario where we define and call a function:

1. **Define the function**: We define a function `add_numbers` that takes two integer parameters `a` and `b` and returns their sum.
```python
def add_numbers(a: int, b: int) -> int:
    return a + b
```
2. **Call the function**: We call `add_numbers` with arguments `5` and `7`.
3. **Create a stack frame**: The call stack creates a new stack frame for `add_numbers`, including space for local variables `a`, `b`, and the return address.
4. **Execute the function body**: The function body executes, adding `a` and `b` and returning the result `12`.
5. **Pop the stack frame**: The stack frame is popped, and control returns to the caller with the result `12`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "A function definition consists of a [[Function_Keyword]], a [[Function_Name]], a [[Parameter_List]], and a [[Return_Type]].",
    "textWithBlanks": "The [[Function_Keyword]] does X",
    "answer": [
      "def"
    ],
    "explanation": "The function keyword in Python is 'def'."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "A function can be defined with duplicate parameter names.",
    "answer": "False",
    "explanation": "A function cannot be defined with duplicate parameter names, as it would cause a compiler error."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the function definition.",
    "content": "def calculate_sum(a: int, b: int) -> str:\n  return a + b",
    "answer": "The return type hint is incorrect. It should be '-> int' instead of '-> str'.",
    "explanation": "The function is returning an integer sum, but the return type hint indicates a string."
  }
]
```