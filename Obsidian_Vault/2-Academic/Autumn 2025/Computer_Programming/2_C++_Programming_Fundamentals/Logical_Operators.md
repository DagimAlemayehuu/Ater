---
title: Logical_Operators
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '2'
hub: "[[2_C++_Programming_Fundamentals_Hub]]"
source: "[[Chapter 2.Pdf]]"
source_pages:
- 47
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you're at a party and you want to know if someone is both over 18 and has a valid ID. Logical operators are like tools that help you make decisions based on multiple conditions. For example, if it's not raining and the sun is shining, you can go to the park.

# 2. Execution Logic & Data Flow
Logical operators, including `AND`, `OR`, and `NOT`, are used to combine [[Boolean_Values]] and produce a resulting [[Boolean_Expression]]. When evaluating a logical expression, the [[Short-Circuit_Evaluation]] technique is often employed to minimize the number of operations required. For instance, in the expression `A AND B`, if `A` is false, the expression immediately evaluates to false without evaluating `B`. The [[Operator_Precedence]] rules dictate the order in which logical operators are applied when there are multiple operators in an expression. The [[Stack_Frame]] is used to store the intermediate results during the evaluation process.

# 3. Edge Cases & Failure States
When working with logical operators, edge cases can arise when dealing with [[Null]] or [[Undefined]] values. For example, in some programming languages, `NULL AND TRUE` may result in an error or a [[Exception]]. Additionally, logical operators can be affected by [[Integer_Overflow]] or [[Underflow]] when working with numeric values that are implicitly converted to [[Boolean_Values]]. It's essential to consider the [[Type_Coercion]] rules in the specific programming language to ensure accurate results when using logical operators.
# 4. Implementation Mechanics
```python
# Annotated AST snippet for the expression: (A AND B) OR C
ast = {
    'type': 'OR',
    'left': {
        'type': 'AND',
        'left': {'type': 'Identifier', 'name': 'A'},
        'right': {'type': 'Identifier', 'name': 'B'}
    },
    'right': {'type': 'Identifier', 'name': 'C'}
}

# Execution block
def evaluate_ast(ast, values):
    if ast['type'] == 'Identifier':
        return values[ast['name']]
    elif ast['type'] == 'AND':
        left = evaluate_ast(ast['left'], values)
        if not left:  # Short-circuit evaluation
            return False
        return evaluate_ast(ast['right'], values)
    elif ast['type'] == 'OR':
        left = evaluate_ast(ast['left'], values)
        if left:  # Short-circuit evaluation
            return True
        return evaluate_ast(ast['right'], values)

# Example usage
values = {'A': True, 'B': False, 'C': True}
result = evaluate_ast(ast, values)
print(result)  # Output: True
```
To read this code, we first define an annotated Abstract Syntax Tree (AST) for the logical expression `(A AND B) OR C`. The `evaluate_ast` function recursively evaluates the AST by applying the logical operators according to their precedence and using short-circuit evaluation. The example usage demonstrates how to evaluate the expression with a given set of values.

## 5. Walkthrough
Here's a step-by-step walkthrough of evaluating the expression `(A AND B) OR C` with `A = True`, `B = False`, and `C = True`:

1. **Initial AST**: The expression is represented as an AST with `OR` as the root, `AND` as the left child, and `C` as the right child.
2. **Evaluate `AND` subtree**: The `AND` subtree has `A` and `B` as its children. Evaluate `A`: `A = True`.
3. **Short-circuit evaluation**: Since `A` is `True`, we need to evaluate `B` to determine the result of `A AND B`. Evaluate `B`: `B = False`.
4. **Evaluate `A AND B`**: Since `B` is `False`, the `A AND B` expression evaluates to `False`.
5. **Evaluate `OR` subtree**: Now that we have the result of the `AND` subtree (`False`), we evaluate the `OR` expression. Since `False OR C` depends on `C`, we evaluate `C`: `C = True`.
6. **Final result**: The `OR` expression evaluates to `True` because one of its operands (`C`) is `True`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The logical operator used to combine two conditions such that both must be true is [[Blank1]].",
    "textWithBlanks": "The logical operator used to combine two conditions such that both must be true is [[Blank1]].",
    "answer": [
      "AND"
    ],
    "explanation": "The AND operator requires both conditions to be true."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "In the expression `A AND B`, if `A` is false, the expression immediately evaluates to false without evaluating `B`.",
    "answer": "True",
    "explanation": "This is an example of short-circuit evaluation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code.",
    "content": "def evaluate_or(a, b):\n  return a and b",
    "answer": "The bug is that the function is supposed to implement the OR operation but is currently implementing the AND operation due to incorrect usage of the 'and' keyword. The correct implementation should use the 'or' keyword.",
    "explanation": "The given code implements the AND operation instead of the OR operation."
  }
]
```