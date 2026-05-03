---
title: Arithmetic_Operators
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
Imagine you're a chef in a busy kitchen, and you need to follow a recipe that involves a series of arithmetic operations to calculate the total amount of ingredients needed. You have a set of basic operations like addition, subtraction, multiplication, and division, which you apply in a specific order to get the correct result. Just like how you follow a recipe to get the right dish, arithmetic operators follow a specific order of operations to produce the correct result.

# 2. Execution Logic & Data Flow
When evaluating an expression with arithmetic operators, the [[Operator_Precedence]] rules dictate the order in which operations are performed. In general, `*`, `/`, and `%` have higher precedence than `+` and `-`, and are evaluated first. If there are multiple operators with the same precedence, the expression is evaluated from left to right, following the [[Left-To-Right_Associativity]] rule. The [[Evaluation_Stack]] is used to store intermediate results during the evaluation process. For example, in the expression `2 + 3 * 4`, the `*` operator is evaluated first, resulting in `3 * 4 = 12`, which is then added to `2` to produce the final result of `14`.

# 3. Edge Cases & Failure States
When dealing with arithmetic operators, boundary conditions like [[Integer_Overflow]] and [[Division_By_Zero]] must be handled carefully to prevent errors. For example, if an expression attempts to divide by zero, a runtime error will occur. Similarly, if an expression evaluates to a value that exceeds the maximum limit of the data type, an integer overflow will occur, leading to incorrect results. Additionally, the [[Modulus_Operator]] can produce unexpected results if the dividend is negative or if the divisor is zero. To mitigate these issues, developers must carefully evaluate expressions and handle edge cases explicitly.
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
This code snippet illustrates how an Abstract Syntax Tree (AST) can be used to represent an arithmetic expression, and how the expression can be evaluated recursively. The `evaluate_ast` function traverses the AST, applying the corresponding arithmetic operation at each node.

The AST represents the expression `2 + 3 * 4`, with the `+` operator as the root node, and the `*` operator as the right child node. The `evaluate_ast` function evaluates the expression by recursively traversing the AST, applying the `*` operation first, and then adding the result to `2`.

## 5. Walkthrough
Here's a step-by-step walkthrough of evaluating the expression `2 + 3 * 4`:

1. The expression is parsed into an AST, with the `+` operator as the root node.
2. The right child node of the `+` operator is another `BinaryExpression` node, representing the `*` operator.
3. The `evaluate_ast` function is called on the AST, starting with the root node.
4. The function recursively evaluates the left child node of the `+` operator, which is a `Literal` node with value `2`.
5. The function then evaluates the right child node of the `+` operator, which is the `BinaryExpression` node representing the `*` operator.
6. The `evaluate_ast` function recursively evaluates the left and right child nodes of the `*` operator, which are `Literal` nodes with values `3` and `4`, respectively.
7. The `*` operator is applied to the values `3` and `4`, resulting in `12`.
8. The `+` operator is then applied to the values `2` and `12`, resulting in the final result of `14`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The [[Operator_Precedence]] rules dictate that the [[High_Precedence_Operators]] are evaluated first.",
    "textWithBlanks": "The [[High_Precedence_Operators]] are [[*]], [[/]], and [[%]].",
    "answer": [
      "*, /, %"
    ],
    "explanation": "Operator precedence rules specify the order in which operations are performed."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "In the expression `2 + 3 * 4`, the `+` operator is evaluated first.",
    "answer": "False",
    "explanation": "The `*` operator has higher precedence than the `+` operator."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code.",
    "content": "def calculate(a, b):\n  return a / (b - b)",
    "answer": "The bug is that the code attempts to divide by zero. The fix is to add a check to ensure that the divisor is not zero.",
    "explanation": "Division by zero is undefined and will result in a runtime error."
  }
]
```