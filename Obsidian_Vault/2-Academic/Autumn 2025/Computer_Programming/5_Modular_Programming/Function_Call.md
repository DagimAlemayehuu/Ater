---
title: Function_Call
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 15
mode: CS-SOFTWARE
read: false
generated: true
prerequisites:
- "[[Function_Definition]]"
---

# 1. Mental Model
Imagine you're at a restaurant and you want to order food. You call out to a waiter, give them your order, and they take it to the kitchen staff. While they prepare your food, you wait. The waiter acts like a messenger, temporarily taking control of your order and passing it along. Similarly, when a program makes a function call, it's like sending a message to a specialized "waiter" (the function) that takes control temporarily, performs a task, and then returns control back to the main program.

# 2. Execution Logic & Data Flow
When a function call is encountered, the program's execution branches to the body of the called function. This process involves creating a new [[Stack_Frame]] on the call stack, which stores the function's local variables, parameters, and return address. The function's parameters are [[Pass_By_Value|Passed]] or [[Pass_By_Reference|Referenced]] according to the language's [[Parameter_Passing_Mode|Parameter Passing Mode]]. The function's body executes until it reaches a return statement, at which point control is transferred back to the caller. The [[Stack_Frame]] for the called function is then destroyed, and the return value, if any, is [[Return_Type|Returned]] to the caller.

# 3. Edge Cases & Failure States
Function calls can encounter edge cases such as [[Stack_Overflow_Error|Stack Overflow Errors]] when a function calls itself recursively without a proper base case, causing the call stack to exceed its maximum size. Another edge case is a [[Null_Pointer_Dereference|Null Pointer Dereference]] when calling a function through a null pointer. Additionally, functions with [[Variable_Number_Of_Arguments|Variable Arguments]] can lead to errors if the argument list is malformed. [[Exception_Handling|Exception Handling]] mechanisms are often used to mitigate these failure states and ensure program stability.
# 4. Implementation Mechanics
```python
def add(a, b):
    result = a + b
    return result

def main():
    x = 5
    y = 3
    sum_result = add(x, y)
    print("Sum:", sum_result)

main()
```
This code snippet demonstrates a simple function call in Python. The `main` function calls the `add` function with arguments `x` and `y`, and then prints the returned result.

To read this: The `main` function initiates a function call to `add` with parameters `x` and `y`. A new stack frame for `add` is created, executing the function's body. The `add` function calculates the sum and returns it, destroying its stack frame. The result is then printed in the `main` function.

## 5. Walkthrough
Consider the following exam scenario:

1. **Initial State**: The program starts executing the `main` function with `x = 5` and `y = 3`.
2. **Function Call**: The `main` function encounters the `add(x, y)` call.
3. **Create Stack Frame**: A new stack frame for `add` is created with parameters `a = 5` and `b = 3`.
4. **Execute Function Body**: The `add` function calculates `result = a + b = 5 + 3 = 8`.
5. **Return Statement**: The `add` function returns `result = 8`, destroying its stack frame.
6. **Return to Caller**: Control returns to `main`, which assigns the returned value to `sum_result`.
7. **Final State**: The `main` function prints `Sum: 8`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "What is created on the call stack when a function is called?",
    "textWithBlanks": "A new [[Blank1]] is created on the call stack.",
    "answer": [
      "stack frame"
    ],
    "explanation": "A stack frame stores local variables, parameters, and return addresses for the function."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "In pass-by-value parameter passing mode, changes to the parameter within the function affect the original variable in the caller.",
    "answer": "False",
    "explanation": "In pass-by-value, changes to the parameter within the function do not affect the original variable."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code.",
    "content": "def factorial(n):\n    if n == 0:\n        return 1\n    else:\n        return n * factorial(n)\nprint(factorial(5))",
    "answer": "The recursive call should be factorial(n-1) instead of factorial(n) to avoid a stack overflow error.",
    "explanation": "The current implementation causes infinite recursion because n never decreases, leading to a stack overflow."
  }
]
```