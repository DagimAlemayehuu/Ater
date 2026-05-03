---
title: Relational_Operators
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '2'
hub: "[[2_C++_Programming_Fundamentals_Hub]]"
source: "[[Chapter 2.Pdf]]"
source_pages:
- 46
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you're comparing the number of cookies you have with the number of cookies your friend has. Relational operators are like asking if your cookies are more, less, or equal to your friend's cookies. They help us make decisions based on how values relate to each other.

# 2. Execution Logic & Data Flow
Relational operators, such as `==`, `!=`, `>`, `<`, `>=` , and `<=`, are used to compare values and return a boolean result. When a relational operator is encountered, the [[Operand]] values are evaluated and then compared according to the operator's logic. The comparison result is then pushed onto the [[Evaluation_Stack]]. For example, in the expression `5 == 5`, the values `5` are compared for equality, and the result `1` (or `true`) is returned. This process is heavily influenced by [[Operator_Precedence]] rules, which dictate the order in which operations are performed.

# 3. Edge Cases & Failure States
When using relational operators, edge cases can arise with [[Nan]] (Not a Number) values and comparisons involving [[Null]] or [[Undefined]] types. For instance, any comparison with `NaN` returns `false`, even `NaN == NaN`. Additionally, attempting to compare values of incompatible types may result in a [[Type_Error]]. It's also crucial to consider the impact of [[Floating_Point_Precision]] on equality comparisons involving decimal numbers. Careful handling of these cases is necessary to ensure the reliability and accuracy of the comparison results.
# 4. Implementation Mechanics
```python
# Annotated AST snippet for relational operator implementation
class RelationalOperator:
    def __init__(self, operator, operand1, operand2):
        self.operator = operator
        self.operand1 = operand1
        self.operand2 = operand2

    def evaluate(self):
        # Evaluate operand values
        val1 = self.operand1.evaluate()
        val2 = self.operand2.evaluate()

        # Compare values based on operator
        if self.operator == '==':
            return val1 == val2
        elif self.operator == '!=':
            return val1 != val2
        elif self.operator == '>':
            return val1 > val2
        elif self.operator == '<':
            return val1 < val2
        elif self.operator == '>=':
            return val1 >= val2
        elif self.operator == '<=':
            return val1 <= val2

# Example usage:
# Create operands
operand1 = Literal(5)
operand2 = Literal(5)

# Create relational operator
eq_operator = RelationalOperator('==', operand1, operand2)

# Evaluate expression
result = eq_operator.evaluate()
print(result)  # Output: True
```
This code snippet illustrates how relational operators can be implemented in a programming language. It defines a `RelationalOperator` class that takes an operator and two operands as input, evaluates the operands, and then compares their values based on the operator. The result of the comparison is returned as a boolean value.

To read this code: The `RelationalOperator` class represents a relational operator in an Abstract Syntax Tree (AST). It has an `evaluate` method that evaluates the operator and its operands, and returns the result of the comparison. The example usage demonstrates how to create operands, a relational operator, and evaluate the expression.

## 5. Walkthrough
Here's a step-by-step walkthrough of applying the relational operator concept to a realistic scenario:

1. **Scenario:** Suppose we want to compare the scores of two students, Alice and Bob, to determine if they have the same score.
2. **Data:** Alice's score is 85, and Bob's score is 90.
3. **Relational Operator:** We want to use the `==` operator to compare their scores.
4. **Evaluation:**
	* Evaluate Alice's score: 85
	* Evaluate Bob's score: 90
	* Compare scores using `==`: 85 != 90, so the result is `False`
5. **Result:** The result of the comparison is `False`, indicating that Alice and Bob do not have the same score.
6. **Decision:** Based on the result, we can make decisions, such as assigning a different grade to each student.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The relational operator [[Blank1]] is used to check if two values are equal.",
    "textWithBlanks": "The [[Blank1]] operator checks for equality.",
    "answer": [
      "=="
    ],
    "explanation": "The '==' operator is used to check if two values are equal."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "The expression '5 == 5.0' returns False.",
    "answer": "False",
    "explanation": "The expression '5 == 5.0' returns True because the values are equal."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code.",
    "content": "def compare_scores(score1, score2):\n  if score1 = score2:\n    return True\n  else:\n    return False",
    "answer": "The bug is in the line 'if score1 = score2:'. It should be 'if score1 == score2:'",
    "explanation": "The single equals sign '=' is an assignment operator, not a comparison operator. It should be replaced with '=='."
  }
]
```