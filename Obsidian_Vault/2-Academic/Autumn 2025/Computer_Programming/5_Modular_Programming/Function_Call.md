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
Imagine you're at a restaurant and you want to order food. You can't just walk into the kitchen and start making your own food, so you call out to a waiter who takes your order and then goes to the kitchen to tell the chef. The chef then prepares your food according to your request. In this scenario, the waiter acts like a messenger who helps you get your food without directly involving you in the cooking process. Similarly, when a program needs to perform a specific task, it makes a "function call" which is like sending a request to a specialized chef (a function) that prepares the task for you.

# 2. Execution Logic & Data Flow
When a program encounters a function call, the execution of the program branches to the body of that function. This process involves creating a new [[Stack_Frame]] on the call stack, which stores the function's local variables, parameters, and return address. The function's parameters are [[Passed_By_Value]] or [[Passed_By_Reference]] into the new stack frame, depending on the programming language's [[Parameter_Passing_Mechanism]]. The program then executes the function's body until it reaches a return statement, at which point control returns to the caller, and the stack frame is destroyed. The return value, if any, is [[Returned_By_Value]] to the caller.

# 3. Edge Cases & Failure States
When dealing with function calls, several edge cases and failure states can occur. For instance, if a function calls itself recursively without a proper base case, it can lead to a [[Stack_Overflow_Error]] due to excessive stack frame creation. Additionally, if a function is called with incorrect parameters, such as a mismatch in the number of arguments or incorrect [[Type Checking]], it can result in a runtime error. Furthermore, if a function fails to return properly, it can cause the program to hang or crash, leading to a [[Deadlock]] or [[Livelock]] situation. Proper error handling and [[Exception Handling]] mechanisms are essential to mitigate these issues.
# 4. Implementation Mechanics
```python
def add(a, b):
    return a + b

def main():
    result = add(5, 7)
    print(result)

main()
```
This code snippet demonstrates a simple function call in Python. The `main` function calls the `add` function with arguments `5` and `7`, and then prints the returned result.

To read this code: The `add` function takes two parameters, `a` and `b`, and returns their sum. The `main` function calls `add` with `5` and `7`, storing the result in the `result` variable, which is then printed.

## 5. Walkthrough
Here's a step-by-step walkthrough of the function call process for the given code:

1. The `main` function is executed, which encounters a call to the `add` function with arguments `5` and `7`.
2. A new stack frame is created for the `add` function, storing the parameters `a = 5` and `b = 7`, as well as the return address to the `main` function.
3. The `add` function executes its body, adding `a` and `b` together, resulting in `12`.
4. The `add` function returns the result `12` to the `main` function.
5. The stack frame for the `add` function is destroyed.
6. The `main` function receives the returned result `12` and stores it in the `result` variable.
7. The `main` function prints the value of `result`, which is `12`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "What is the term for the process of creating a new stack frame when a function is called?",
    "textWithBlanks": "When a function is called, a new [[Stack_Frame]] is created on the [[Call_Stack]].",
    "answer": [
      "stack frame",
      "call stack"
    ],
    "explanation": "This process involves creating a new stack frame on the call stack."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "If a function calls itself recursively without a proper base case, it can lead to a stack overflow error.",
    "answer": "True",
    "explanation": "This is a correct statement regarding function calls and stack overflow errors."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code.",
    "content": "def factorial(n):\n    return n * factorial(n)\nprint(factorial(5))",
    "answer": "The bug is that the function does not have a base case to stop the recursion. The corrected code should be:\ndef factorial(n):\n    if n == 0 or n == 1:\n        return 1\n    else:\n        return n * factorial(n-1)\nprint(factorial(5))",
    "explanation": "The bug is a missing base case for the recursive function, leading to a stack overflow error."
  }
]
```