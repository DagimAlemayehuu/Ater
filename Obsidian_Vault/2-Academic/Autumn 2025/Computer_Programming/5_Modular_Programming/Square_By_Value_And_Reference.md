---
title: Square_by_Value_and_Reference
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 59
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you have a piece of paper with a number written on it, and you give it to two people, Alice and Bob. If you want to change the number on the paper and have both Alice and Bob see the new number, you need to give them a magic piece of paper that they can both write on. But if you just give them a regular piece of paper and tell them to write the number squared on a new piece of paper, they will end up with different pieces of paper. This is similar to how `squareByValue` and `squareByReference` work, where `squareByValue` is like giving a regular piece of paper and `squareByReference` is like giving a magic piece of paper.

# 2. Execution Logic & Data Flow
When `squareByValue` is called with an argument, a [[Copy_Elision]] occurs, and a temporary copy of the argument `x` is created on the [[Call_Stack]]. The function then calculates the square of `x` and assigns it back to the local copy of `x`, which is then discarded when the function returns. In contrast, `squareByReference` takes a reference to an `int` as an argument, which is essentially an alias for the original variable. The function then calculates the square of `x` and assigns it directly to the original variable through the reference, modifying it in-place. This is made possible by [[Lvalue_References]] and [[Reference_Type]]s. The [[Parameter_Passing]] mechanism is crucial here, as it determines whether a copy or a reference is passed to the function.

# 3. Edge Cases & Failure States
When using `squareByValue`, if the input value is large, it may cause an [[Integer_Overflow]], resulting in an incorrect result. Additionally, if the input is a temporary value, such as `squareByValue(5)`, the change will not be visible outside the function, as the temporary value is discarded. On the other hand, `squareByReference` can modify the original variable in-place, but it requires a valid [[Lvalue]] as an argument, which means you cannot pass a temporary value or a literal like `squareByReference(5)`, as it would result in a [[Compiler_Error]]. Furthermore, if the reference is not valid, it may lead to [[Undefined_Behavior]].
# 4. Implementation Mechanics
```cpp
int squareByValue(int x) {
  x = x * x;
  return x;
}

void squareByReference(int& x) {
  x = x * x;
}

int main() {
  int a = 5;
  int b = squareByValue(a);
  squareByReference(a);
  return 0;
}
```
To read this code snippet: The `squareByValue` function takes an integer `x` by value, calculates its square, and returns the result. The `squareByReference` function takes an integer reference `x` and calculates its square in-place, modifying the original variable. In the `main` function, we demonstrate the usage of both functions with a variable `a`.

## 5. Walkthrough
Here's a step-by-step walkthrough of the code:

1. Initially, `a` is set to 5.
2. When `squareByValue(a)` is called, a temporary copy of `a` (which is 5) is created on the call stack. The function calculates the square of this copy, which is 25, and returns it. The result is assigned to `b`, so `b` becomes 25. However, `a` remains unchanged, still being 5.
3. When `squareByReference(a)` is called, the function takes a reference to `a` and calculates its square in-place. The value of `a` is updated to 25.
4. At the end of the `main` function, `a` is 25, and `b` is 25.

Intermediate calculations:

* `squareByValue(a)`: `x` = 5, `x` * `x` = 25, returned value = 25
* `squareByReference(a)`: `x` = 5, `x` * `x` = 25, `a` = 25

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "When a function takes an argument by value, a [[Copy]] of the argument is created on the [[Call_Stack]].",
    "textWithBlanks": "The [[Copy]] of the argument is used within the function, and any changes made to it do not affect the original [[Variable]].",
    "answer": [
      "copy",
      "variable"
    ],
    "explanation": "This is a fundamental concept in programming, where passing by value creates a local copy of the argument."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "You can pass a temporary value to a function that takes an argument by reference.",
    "answer": "False",
    "explanation": "Passing a temporary value to a function that takes an argument by reference would result in a compiler error, as a temporary value is not an lvalue."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code.",
    "content": "void squareByReference(const int& x) { x = x * x; }",
    "answer": "The bug is that the reference parameter x is marked as const, but the function is trying to modify it. The fix is to remove the const keyword.",
    "explanation": "The const keyword indicates that the variable should not be modified, but the function is attempting to modify it, which is not allowed."
  }
]
```