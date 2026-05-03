---
title: Expression_Statements
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '2'
hub: "[[2_C++_Programming_Fundamentals_Hub]]"
source: "[[Chapter 2.Pdf]]"
source_pages:
- 52
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you're at a restaurant and you order a meal. The act of ordering is like an expression that evaluates to the meal you want. An expression statement is like the restaurant taking your order and doing something with it, such as preparing the meal. In programming, an expression statement is a way to evaluate an expression and then do something with the result.

# 2. Execution Logic & Data Flow
In C++, an expression statement is a statement that consists of an expression followed by a semicolon. When the program executes an expression statement, it evaluates the expression and then [[Discards]] the result, unless the expression has a [[Side Effect]], such as modifying a variable or [[Invoking A Function]]. The expression is evaluated according to the [[Operator Precedence]] rules, and the [[Type]] of the expression is determined by the [[Type Inference]] rules. The expression statement can also involve [[Lvalue]] expressions, which can be modified, or [[Rvalue]] expressions, which cannot be modified.

# 3. Edge Cases & Failure States
When dealing with expression statements, there are several edge cases to consider. For example, if the expression has no [[Side Effects]] and the result is not used, the expression statement may be [[Optimized Away]] by the compiler. Additionally, if the expression involves a [[Function Call]] with [[Void]] return type, the expression statement is still valid, but the result of the function call is discarded. However, if the expression involves an [[Assignment Operator]], the result of the assignment is an [[Lvalue]] that refers to the assigned variable. If the expression statement causes an [[Exception]] to be thrown, the program's [[Stack Frame]] may be [[Unwound]], leading to unexpected behavior.
# 4. Implementation Mechanics
```cpp
#include <iostream>

int main() {
    int x = 5;
    x = x + 1;  // Expression statement with side effect
    std::cout << x << std::endl;

    int y = 10;
    y;  // Expression statement without side effect

    return 0;
}
```
This C++ code demonstrates expression statements with and without side effects. The first expression statement `x = x + 1;` has a side effect, as it modifies the value of `x`. The second expression statement `y;` does not have a side effect, as it simply evaluates the value of `y` and discards the result.

---
## 5. Walkthrough
Consider the following scenario:

Suppose we have a simple banking system where we want to update a customer's account balance. We will use expression statements to perform the update.

1. Initially, the customer's account balance is `$100`.
2. We want to deposit `$50` into the account. We can use an expression statement like `balance = balance + 50;`.
3. After evaluating the expression, the new balance is `$150`.
4. Next, we want to withdraw `$20` from the account. We can use another expression statement like `balance = balance - 20;`.
5. After evaluating this expression, the new balance is `$130`.

The expression statements in this scenario have side effects, as they modify the account balance.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "An expression statement in C++ is a statement that consists of an expression followed by a [[Blank1]]",
    "textWithBlanks": "An expression statement in C++ is a statement that consists of an expression followed by a [[Blank1]].",
    "answer": [
      "semicolon"
    ],
    "explanation": "In C++, an expression statement is a statement that consists of an expression followed by a semicolon."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "An expression statement with no side effects and unused result may be optimized away by the compiler.",
    "answer": "True",
    "explanation": "If an expression statement has no side effects and the result is not used, the compiler may optimize it away."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code.",
    "content": "int main() { int x = 5; x = x +; std::cout << x << std::endl; return 0; }",
    "answer": "The bug is in the line 'x = x +;'. It should be 'x = x + 1;' or some other valid expression. The corrected code is: int main() { int x = 5; x = x + 1; std::cout << x << std::endl; return 0; }",
    "explanation": "The bug is a syntax error due to the missing operand in the expression."
  }
]
```