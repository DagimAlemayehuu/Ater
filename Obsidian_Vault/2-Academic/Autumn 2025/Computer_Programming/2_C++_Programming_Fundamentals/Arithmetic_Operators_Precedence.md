---
title: Arithmetic_Operators_Precedence
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '2'
hub: "[[2_C++_Programming_Fundamentals_Hub]]"
source: "[[Chapter 2.Pdf]]"
source_pages:
- 40
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you're following a recipe to make a cake. The recipe has many steps, and some steps are inside parentheses, like "mix the ingredients (2 cups of flour, 1 cup of sugar)". You need to do the steps inside the parentheses first, and then use those results to complete the rest of the recipe. Similarly, when we write arithmetic expressions with many operators, like `2 + 3 * 4`, we need to follow a specific order to evaluate them correctly. This order is called operator precedence.

# 2. Execution Logic & Data Flow
When evaluating an arithmetic expression, the compiler or interpreter follows a strict set of rules to determine the order of operations. This is achieved through [[Operator_Precedence]] and [[Order_Of_Operations]]. In C++, the precedence order is as follows: parentheses `()` are evaluated first, from innermost to outermost. Once the expressions inside parentheses are resolved, the compiler evaluates any exponentiation operations (none in C++'s built-in operators), then multiplication and division from left to right, and finally addition and subtraction from left to right. The expression is evaluated using a [[Parse_Tree]], which represents the syntactic structure of the expression. The parser constructs this tree by applying the rules of [[Syntax_Analysis]].

# 3. Edge Cases & Failure States
When dealing with arithmetic operator precedence, there are several edge cases to consider. For example, expressions with nested parentheses, like `(2 + 3) * 4`, require careful evaluation to avoid [[Integer_Overflow]] or [[Underflow]]. Additionally, expressions with multiple operators of the same precedence, like `2 + 3 + 4`, must be evaluated from left to right to ensure correctness. Failure to follow the correct order of operations can result in [[Undefined_Behavior]] or incorrect results. In C++, using parentheses to group expressions can help avoid ambiguity and ensure the desired evaluation order, as seen in the example: `int result = (2 + 3) * 4;`.
# 4. Implementation Mechanics
```cpp
int main() {
    int a = 2;
    int b = 3;
    int c = 4;
    int result = a + b * c;
    return 0;
}
```
This C++ code demonstrates how arithmetic operator precedence works in a real-world scenario. The expression `a + b * c` is evaluated using the precedence rules.

To read this code: The variables `a`, `b`, and `c` are initialized with values 2, 3, and 4, respectively. The expression `a + b * c` is then evaluated, and the result is stored in the variable `result`. 

The expression can be represented as an ASCII memory/stack diagram:
```
  +---------------+
  |  a  |  b  |  c  |
  +---------------+
  |  2   |  3   |  4   |
  +---------------+
           |
           |
           v
  +---------------+
  |  b * c  |
  +---------------+
           |
           |
           v
  +---------------+
  |  a + (b * c)  |
  +---------------+
           |
           |
           v
  +---------------+
  |  result  |
  +---------------+
```

## 5. Walkthrough
Here's a step-by-step walkthrough of evaluating the expression `2 + 3 * 4`:

1. The compiler encounters the expression `2 + 3 * 4` and constructs a parse tree.
2. Following the operator precedence rules, the compiler evaluates the multiplication operation `3 * 4` first, which equals $12$.
3. The expression now becomes `2 + 12`.
4. Next, the compiler evaluates the addition operation `2 + 12`, which equals $14$.
5. The final result of the expression `2 + 3 * 4` is $14$.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The order of operations in C++ is determined by [[Operator_Precedence]] and [[Order_Of_Operations]]. The first step is to evaluate expressions inside _______.",
    "textWithBlanks": "The order of operations in C++ is determined by [[Operator_Precedence]] and [[Order_Of_Operations]]. The first step is to evaluate expressions inside [[Blank1]].",
    "answer": [
      "parentheses"
    ],
    "explanation": "The first step in evaluating an expression is to evaluate expressions inside parentheses."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "In the expression `2 + 3 * 4`, the addition operation is evaluated before the multiplication operation.",
    "answer": "False",
    "explanation": "According to operator precedence rules, multiplication is evaluated before addition."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code that is supposed to calculate the result of `2 + 3 * 4`.",
    "content": "int result = 2 * 3 + 4;",
    "answer": "The bug is that the code is evaluating the expression as `(2 * 3) + 4` instead of `2 + (3 * 4)`. The correct code should be `int result = 2 + 3 * 4;` or `int result = 2 + (3 * 4);`.",
    "explanation": "The bug is due to incorrect operator precedence."
  }
]
```