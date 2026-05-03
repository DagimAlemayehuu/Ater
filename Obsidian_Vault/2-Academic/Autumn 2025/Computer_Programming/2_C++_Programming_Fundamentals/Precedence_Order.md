---
title: Precedence_Order
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
Imagine you're following a recipe to make a cake. The recipe has many steps, but some steps need to be done before others. For example, you need to mix the batter before baking it. In programming, operators like `*` and `+` have a similar "order of operations" to ensure expressions are evaluated correctly. This order is called the precedence order.

# 2. Execution Logic & Data Flow
The precedence order determines how expressions are evaluated mechanically. When an expression contains multiple operators, the [[Parser]] analyzes it and applies the operators in a specific order based on their precedence. For instance, in the expression `2 + 3 * 4`, the `*` operator has higher precedence than the `+` operator, so it's evaluated first, resulting in `2 + 12`. The [[Abstract_Syntax_Tree]] is used to represent the expression, and the [[Semantic_Analyzer]] traverses it to perform the evaluation. The expression is ultimately evaluated using a [[Stack_Frame]].

# 3. Edge Cases & Failure States
When dealing with operators of the same precedence, such as `/` and `%`, the expression is evaluated from left to right. For example, in `12 / 3 % 2`, the `/` operator is evaluated first, resulting in `4 % 2`. If the expression is not properly parenthesized, it can lead to [[Ambiguous_Expression]] errors. Additionally, when working with [[Overloaded_Operators]], the precedence order may not be immediately clear, and careful consideration must be taken to avoid [[Operator_Precedence]] issues.
# 4. Implementation Mechanics
```cpp
int main() {
    int a = 2;
    int b = 3;
    int c = 4;

    // Expression with multiple operators
    int result = a + b * c;

    // Print the result
    return 0;
}
```
This C++ code demonstrates how expressions are evaluated mechanically. The expression `a + b * c` is evaluated based on the precedence order of the operators.

To read this code: The expression `a + b * c` is evaluated as `a + (b * c)` due to the higher precedence of the `*` operator. The result is then stored in the `result` variable.

The stack frame for this expression would look like this:
```
  +---------------+
  |  a  |  b  |  c  |
  +---------------+
           |
           |
           v
  +---------------+
  |  result  |
  +---------------+
           |
           |
           v
  +---------------+
  |  Stack Frame  |
  +---------------+
```
The abstract syntax tree (AST) for the expression would be:
```
    +
   / \
  a   *
     / \
    b   c
```
The parser analyzes the expression and creates the AST, which is then traversed by the semantic analyzer to perform the evaluation.

## 5. Walkthrough
Here's a rigorous, multi-step exam scenario applying the concept of precedence order:

1. Evaluate the expression `2 + 3 * 4`:
   - The parser analyzes the expression and creates an AST:
```
       +
      / \
     2   *
        / \
       3   4
```
   - The semantic analyzer traverses the AST and evaluates the expression:
     - The `*` operator has higher precedence, so `3 * 4` is evaluated first: $3 \times 4 = 12$
     - The expression becomes $2 + 12$
     - The final result is: $2 + 12 = 14$

2. Evaluate the expression `12 / 3 % 2`:
   - The parser analyzes the expression and creates an AST:
```
       %
      / \
     /   2
    / \
   12   3
```
   - The semantic analyzer traverses the AST and evaluates the expression:
     - The `/` and `%` operators have the same precedence, so the expression is evaluated from left to right:
       - $12 \div 3 = 4$
       - $4 \mod 2 = 0$

3. Evaluate the expression `(2 + 3) * 4`:
   - The parser analyzes the expression and creates an AST:
```
       *
      / \
     +   4
    / \
   2   3
```
   - The semantic analyzer traverses the AST and evaluates the expression:
     - The expression inside the parentheses is evaluated first: $2 + 3 = 5$
     - The expression becomes $5 \times 4$
     - The final result is: $5 \times 4 = 20$

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The precedence order determines how expressions are evaluated [[Blank1]]",
    "textWithBlanks": "The precedence order determines how expressions are evaluated [[Blank1]]",
    "answer": [
      "mechanically"
    ],
    "explanation": "The precedence order determines how expressions are evaluated mechanically."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "In the expression `2 + 3 * 4`, the `+` operator is evaluated first.",
    "answer": "False",
    "explanation": "In the expression `2 + 3 * 4`, the `*` operator has higher precedence and is evaluated first."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code that evaluates the expression `2 + 3 * 4`.",
    "content": "int result = 2 * 3 + 4;",
    "answer": "The bug is that the code does not follow the correct order of operations. The correct code should be: int result = 2 + 3 * 4;",
    "explanation": "The bug is that the code does not follow the correct order of operations."
  }
]
```