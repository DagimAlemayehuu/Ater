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
- "[[Function_Prototype]]"
---

# 1. Mental Model
Imagine you're ordering food at a restaurant. You tell the waiter what you want, like a burger, and they take that request to the kitchen staff. A function definition is like writing down the recipe for that burger - it tells the compiler (or the kitchen) exactly how to make it, what ingredients to use, and what to do with them.

# 2. Execution Logic & Data Flow
When a function is defined, it creates a new [[Stack_Frame]] that stores the function's local variables, parameters, and return address. The function definition specifies the [[Function_Signature]], which includes the function's name, return type, and parameter list. When the function is called, the [[Call_Stack]] is used to manage the flow of execution, pushing the current state onto the stack and popping it off when the function returns. The function's body is then executed, following the rules of [[Scope_Resolution]] to determine which variables to use.

# 3. Edge Cases & Failure States
When defining a function, there are several edge cases to consider. For example, if a function is defined with [[Default_Argument_Values]], but the caller doesn't provide a value for that parameter, the default value will be used. However, if the function is defined with [[Variable_Number_Of_Arguments]], the compiler needs to handle the possibility of a mismatch between the number of arguments passed and the number of parameters defined. Additionally, if a function is defined with a [[Return_Type]] that doesn't match the type of value being returned, the compiler will flag an error. Finally, if a function is defined with [[Function_Overloading]], the compiler needs to use [[Name_Lookup]] to determine which function to call based on the provided arguments.
# 4. Implementation Mechanics
```python
def greet(name: str) -> str:
    # Create a local variable
    message = "Hello, " + name + "!"
    # Return the message
    return message

# Call the function
result = greet("John")
print(result)  # Output: Hello, John!
```
This code snippet demonstrates a simple function definition in Python. The `greet` function takes a `name` parameter, creates a local `message` variable, and returns the greeting message.

The function definition specifies the function's name, return type, and parameter list. When the function is called, the function's body is executed, and the return value is printed to the console.

## 5. Walkthrough
Here's a step-by-step walkthrough of the function definition and call:

1. The `greet` function is defined with a `name` parameter of type `str` and a return type of `str`.
2. The function is called with the argument `"John"`.
3. A new stack frame is created for the `greet` function, storing the local variable `message` and the return address.
4. The function's body is executed, concatenating the strings `"Hello, "`, `"John"`, and `"!"` to create the `message` variable.
5. The `message` variable is returned, and its value is assigned to the `result` variable.
6. The `result` variable is printed to the console, outputting `"Hello, John!"`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "A function definition specifies the function's [[Blank1]], which includes the function's name, return type, and parameter list.",
    "textWithBlanks": "A function definition specifies the function's [[Blank1]]",
    "answer": [
      "Function_Signature"
    ],
    "explanation": "The function signature is a critical component of a function definition, providing essential information about the function's behavior."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "When a function is called, a new stack frame is created only if the function has local variables.",
    "answer": "False",
    "explanation": "A new stack frame is created for every function call, regardless of whether the function has local variables or not."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code:",
    "content": "def add(a, b):\n  return a + c",
    "answer": "The bug is that the variable 'c' is not defined. The correct variable name should be 'b'. The corrected code is: def add(a, b):\n  return a + b",
    "explanation": "The code is attempting to use an undefined variable 'c', which will result in a runtime error."
  }
]
```