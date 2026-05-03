---
title: Precedence_Operators
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
Imagine you're following a recipe to make a cake, and you need to mix ingredients in a specific order. Precedence operators are like the recipe's instructions that tell you which ingredients to mix first, ensuring you get the right result. Just as you need to follow the recipe's steps in order, programming languages use precedence operators to determine the order in which to evaluate expressions.

# 2. Execution Logic & Data Flow
When evaluating an expression with multiple operators, the [[Parser]] analyzes the expression and applies the [[Operator_Precedence]] rules to determine the order of operations. The [[Abstract_Syntax_Tree]] (AST) is constructed to represent the expression, and then the [[Interpreter]] or [[Compiler]] traverses the AST to evaluate the expression. The precedence operators dictate that higher-precedence operators are evaluated before lower-precedence ones. For example, in the expression `2 + 3 * 4`, the `*` operator has higher precedence than the `+` operator, so `3 * 4` is evaluated first, resulting in `2 + 12`. The `+` operator is then applied to produce the final result.

# 3. Edge Cases & Failure States
When dealing with expressions that have multiple operators with the same precedence, such as `2 / 3 % 2`, the [[Associativity]] of the operators comes into play. In this case, the `/` and `%` operators have the same precedence, and since they are [[Left_Associative]], the expression is evaluated from left to right, resulting in `(2 / 3) % 2`. If the expression is not well-formed, such as `2 +`, a [[Syntax_Error]] is raised, and the program may terminate or enter an [[Error_State]]. Additionally, when working with [[Floating_Point]] numbers, the order of operations can affect the accuracy of the result due to [[Rounding_Error]].
# 4. Implementation Mechanics
```python
# Annotated AST snippet for the expression: 2 + 3 * 4
ast = {
    "type": "BinaryExpression",
    "operator": "+",
    "left": {
        "type": "Literal",
        "value": 2
    },
    "right": {
        "type": "BinaryExpression",
        "operator": "*",
        "left": {
            "type": "Literal",
            "value": 3
        },
        "right": {
            "type": "Literal",
            "value": 4
        }
    }
}

# Execution block
def evaluate_ast(ast):
    if ast["type"] == "Literal":
        return ast["value"]
    elif ast["type"] == "BinaryExpression":
        left_value = evaluate_ast(ast["left"])
        right_value = evaluate_ast(ast["right"])
        
        if ast["operator"] == "+":
            return left_value + right_value
        elif ast["operator"] == "*":
            return left_value * right_value

result = evaluate_ast(ast)
print(result)  # Output: 14
```
To read this, we first examine the structure of the Abstract Syntax Tree (AST) for the expression `2 + 3 * 4`. The AST is a nested dictionary representing the expression's operator and operands. We then walk through the AST using a recursive function `evaluate_ast`, applying the operators in the correct order based on their precedence.

## 5. Walkthrough
Here's a step-by-step walkthrough of evaluating the expression `2 + 3 * 4`:

1. **Parsing**: The expression `2 + 3 * 4` is parsed into an AST.
2. **AST Construction**: The AST is built with `+` as the root operator, `2` as its left child, and a subtree with `*` as its root, `3` and `4` as its children.
3. **Evaluation**: The AST is traversed. The `*` operator has higher precedence than `+`, so `3 * 4` is evaluated first.
4. **Intermediate Calculation**: `3 * 4 = 12`.
5. **Final Calculation**: The expression simplifies to `2 + 12`, which equals `14`.
6. **Result**: The final result of the expression `2 + 3 * 4` is `14`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "Precedence operators determine the [[Blank1]] in which to evaluate expressions.",
    "textWithBlanks": "Precedence operators determine the [[Blank1]] in which to evaluate expressions.",
    "answer": [
      "order"
    ],
    "explanation": "Precedence operators dictate the order of operations."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "In the expression `2 + 3 * 4`, the `+` operator is evaluated before the `*` operator.",
    "answer": "False",
    "explanation": "The `*` operator has higher precedence than the `+` operator."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code snippet for evaluating expressions.",
    "content": "def evaluate_expression(expression):\n  if expression == '2 + 3 * 4':\n    return 2 + 3 * 4\n  else:\n    return 'Invalid expression'",
    "answer": "The bug is that it does not correctly handle operator precedence for all expressions. It should parse and evaluate any expression based on precedence rules.",
    "explanation": "The provided code snippet does not handle expressions dynamically and does not apply precedence rules universally."
  }
]
```