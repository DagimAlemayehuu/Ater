---
title: Local_Variables
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 19
mode: CS-SOFTWARE
read: false
generated: true
prerequisites:
- "[[Local_Identifier]]"
---

# 1. Mental Model
Imagine you're in a small, temporary office cubicle within a large company. The cubicle is like a block of code, and the papers you have on your desk are like local variables. Just as those papers are only accessible and relevant while you're working in that cubicle, local variables are only accessible within the block of code they're declared in. When you leave the cubicle, the papers are discarded or stored away, similarly, local variables are discarded when the block is exited.

# 2. Execution Logic & Data Flow
Local variables are created and managed through a process that involves the [[Call_Stack]], which keeps track of the active subroutines of a program. When a block of code is entered, a new [[Stack_Frame]] is created on the call stack, which includes space for local variables. The [[Variable_Declaration]] of a local variable allocates memory within this stack frame. Access to these variables is direct, using their names, and is resolved by the compiler or interpreter through [[Symbol_Table]] lookups. The memory allocated for local variables is automatically deallocated when the stack frame is popped off the call stack as the block is exited, which helps prevent memory leaks.

# 3. Edge Cases & Failure States
Local variables can lead to issues if not properly understood, such as [[Variable_Shadowing]], where a local variable with the same name as a variable in an outer scope hides that outer variable. Additionally, attempting to access a local variable outside its block results in a [[Compilation_Error]] or [[Runtime_Error]], depending on the language. The [[Scope_Resolution]] rules of a programming language dictate how variables are looked up, which can affect how local variables interact with variables in outer scopes. Care must also be taken with [[Mutable_Default_Arguments]] and other edge cases that can lead to unexpected behavior when dealing with local variables in certain languages.
# 4. Implementation Mechanics
```python
def outer_function():
    outer_var = 10  # outer variable

    def inner_function():
        inner_var = 20  # local variable
        print("Inner function:")
        print("outer_var:", outer_var)
        print("inner_var:", inner_var)

    inner_function()
    # print("outer_var:", outer_var)
    # print("inner_var:", inner_var)  # This would cause a NameError

outer_function()
```
This code snippet demonstrates the concept of local variables. The `inner_var` is a local variable declared within the `inner_function` block. 

The `inner_function` has access to both its local variable `inner_var` and the variable from the outer scope `outer_var`. However, when trying to access `inner_var` outside of its block (in this case, in the `outer_function` after `inner_function` has been called), it results in a `NameError` because `inner_var` is not defined in that scope.

## 5. Walkthrough
Let's walk through a scenario to understand local variables better:

1. **Initial State**: We have a program with two functions: `main` and `calculate_area`. The `main` function has a variable `length` with a value of 5.

2. **Step 1**: The program enters the `main` function. The `length` variable is created on the stack with a value of 5.

3. **Step 2**: The `main` function calls `calculate_area`. A new stack frame for `calculate_area` is created. This stack frame has its own space for local variables.

4. **Step 3**: Within `calculate_area`, a local variable `width` is declared with a value of 3. This variable is stored in the `calculate_area` stack frame.

5. **Step 4**: The `calculate_area` function calculates the area using `length` and `width` and prints the result. The `length` variable is accessed from the outer scope.

6. **Step 5**: The `calculate_area` function ends. Its stack frame is popped off the call stack, which means `width` is no longer accessible.

7. **Step 6**: The program returns to `main`. If it tries to access `width`, it will result in an error because `width` was a local variable of `calculate_area` and is no longer in scope.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "Local variables are stored in a [[Blank1]] on the [[Blank2]].",
    "textWithBlanks": "Local variables are stored in a [[Blank1]] on the [[Blank2]].",
    "answer": [
      "stack frame",
      "call stack"
    ],
    "explanation": "Local variables are allocated memory within a stack frame on the call stack."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "Local variables can be accessed from any part of the program.",
    "answer": "False",
    "explanation": "Local variables are only accessible within the block of code they are declared in."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code snippet.",
    "content": "def calculate_sum():\n    result = 0\n    def add(num):\n        result = result + num\n    add(5)\n    print(result)",
    "answer": "{\"bug\": \"The variable result in the inner function is treated as local but not initialized before use. To fix, use nonlocal result or return result from inner function.\"}",
    "explanation": "The issue arises because Python treats `result` in the inner function as a local variable, which is not initialized before use."
  }
]
```