---
title: Operator_Precedence
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
Imagine you're following a recipe to make a cake. The recipe has many steps, and some steps are inside others, like "first, mix the batter" and "inside the batter mix, add sugar." Operator precedence works like this recipe, telling the computer which parts of an expression to evaluate first, especially when there are many operators like `+`, `*`, and parentheses.

# 2. Execution Logic & Data Flow
The execution logic for operator precedence involves evaluating expressions based on a predefined order of operations. When an expression is encountered, the parser evaluates it according to the [[Order_Of_Operations]] rules, which dictate that expressions inside parentheses are evaluated first. This process occurs within the [[Parser]] and [[Abstract_Syntax_Tree]] (AST) construction phases. The [[Stack_Frame]] may also play a role in temporarily storing intermediate results during expression evaluation. For instance, in an expression like `2 + 3 * 4`, the `*` operator has higher precedence than the `+` operator, so `3 * 4` is evaluated first. 

# 3. Edge Cases & Failure States
Edge cases for operator precedence include handling nested expressions with multiple operators, such as `(2 + 3) * 4` versus `2 + (3 * 4)`. Failure states can arise from ambiguous or malformed expressions, like `2 + 3 *`, which cannot be parsed according to the [[Language_Syntax]]. The [[Parser]] must handle such cases by reporting syntax errors. Additionally, expressions involving consecutive operators, like `2 ++ 3`, require careful handling based on the [[Tokenization]] rules and [[Operator_Precedence]] table. In languages with dynamic typing, [[Type_Coercion]] may also interact with operator precedence, leading to additional complexity.
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
To read this, we first look at the Abstract Syntax Tree (AST) representation of the expression `2 + 3 * 4`. The AST is a nested structure showing the operator precedence. The execution block `evaluate_ast` function recursively evaluates this AST, applying the operations in the correct order based on their precedence.

## 5. Walkthrough
Here's a step-by-step walkthrough of evaluating the expression `2 + 3 * 4`:

1. **Parsing**: The expression `2 + 3 * 4` is parsed into an AST.
2. **AST Construction**: The AST for `2 + 3 * 4` is built as shown in the implementation mechanics section.
3. **Evaluation**: The `evaluate_ast` function is called with the AST.
4. **Recursion**: The function recursively evaluates the AST. It starts with the `Literal` nodes, returning their values (2, 3, and 4).
5. **Operator Precedence**: The function encounters the `*` operator, which has higher precedence than `+`. So, it evaluates `3 * 4` first, yielding `12`.
6. **Intermediate Result**: The result of `3 * 4` (which is `12`) is used as the right operand for the `+` operator.
7. **Final Evaluation**: The function then evaluates `2 + 12`, yielding `14`.
8. **Result**: The final result of the expression `2 + 3 * 4` is `14`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The operator precedence rules dictate that expressions inside [[Blank1]] are evaluated first.",
    "textWithBlanks": "The operator precedence rules dictate that expressions inside [[Blank1]] are evaluated first.",
    "answer": [
      "parentheses"
    ],
    "explanation": "This is a fundamental principle of operator precedence."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "In the expression `2 + 3 * 4`, the `+` operator is evaluated before the `*` operator.",
    "answer": "False",
    "explanation": "Due to operator precedence, `*` is evaluated before `+`."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code for evaluating expressions.",
    "content": "def buggy_evaluate_ast(ast):\n  if ast['type'] == 'Literal':\n    return ast['value']\n  elif ast['type'] == 'BinaryExpression':\n    left_value = evaluate_ast(ast['right'])\n    right_value = evaluate_ast(ast['left'])\n    if ast['operator'] == '+':\n      return left_value + right_value",
    "answer": "The bug is in the lines where left_value and right_value are assigned and the if condition syntax.",
    "explanation": "The function will throw an error because evaluate_ast is not defined and the if condition syntax is incorrect."
  }
]
```