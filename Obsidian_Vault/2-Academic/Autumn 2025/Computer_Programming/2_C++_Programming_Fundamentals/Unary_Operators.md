---
title: Unary_Operators
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '2'
hub: "[[2_C++_Programming_Fundamentals_Hub]]"
source: "[[Chapter 2.Pdf]]"
source_pages:
- 51
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you're at a store with a "reverse" discount sign. A unary operator is like a single-action button that takes one value and changes it in some way, like flipping a switch to turn something on or off. For example, if you have a sign that says "-10%" and you apply it to one price, that's like a unary operator.

# 2. Execution Logic & Data Flow
Unary operators work by taking a single operand and applying a specific operation to it. In C++, when a unary operator is encountered, the compiler generates code that performs the operation and returns the result. The [[Operator_Precedence]] rules dictate the order in which unary operators are evaluated when there are multiple operators in an expression. The [[Stack_Frame]] is used to store the temporary results of the operation. For example, in the expression `x = -5`, the unary minus operator is applied to the literal `5`, and the result is stored in `x`. The [[Type Promotion]] rules also come into play when the operand is promoted to a compatible type.

# 3. Edge Cases & Failure States
When dealing with unary operators, edge cases arise when the operand is not a numeric type or when the operator is not defined for the operand's type. For instance, applying the unary minus operator to a non-numeric type, such as a `std::string`, results in a [[Compiler_Error]]. Additionally, when working with [[Pointer]] types, unary operators like `*` and `&` must be used carefully to avoid [[Dereferencing]] issues. The [[Overflow]] behavior also needs to be considered when applying unary operators to large values. In C++, the `++` and `--` operators can lead to [[Undefined Behavior]] if applied to invalid or non-modifiable lvalues.
# 4. Implementation Mechanics
```cpp
int x = 5;
int y = -x;  // Unary minus operator
```
The above code block demonstrates the use of the unary minus operator in C++. The operator takes the value of `x` and negates it, storing the result in `y`. 

To read this: The variable `x` is initialized with the value `5`. The unary minus operator is then applied to `x`, and the result is stored in `y`. Therefore, `y` will have the value `-5`.

```
  +---------------+
  |  Stack Frame  |
  +---------------+
  |  x = 5       |
  |  y = -x      |
  |  y = -5      |
  +---------------+
           |
           |
           v
  +---------------+
  |  Memory      |
  +---------------+
  |  x:  5       |
  |  y: -5       |
  +---------------+
```

## 5. Walkthrough
Consider the following scenario:

1. We have an integer variable `a` initialized to `10`.
2. We apply the unary plus operator to `a` and store the result in `b`. The expression is `b = +a;`.
3. The value of `b` is then printed to the console.
4. Next, we apply the unary minus operator to `a` and store the result in `c`. The expression is `c = -a;`.
5. Finally, the values of `b` and `c` are printed to the console.

Intermediate calculations:

* `b = +a` => `b = +10` => `b = 10`
* `c = -a` => `c = -10`

The final values are:

* `b = 10`
* `c = -10`

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The unary operator that changes the sign of a number is [[Blank1]].",
    "textWithBlanks": "The [[Blank1]] operator changes the sign of a number.",
    "answer": [
      "minus"
    ],
    "explanation": "The unary minus operator changes the sign of a number."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "Applying the unary minus operator to a non-numeric type results in a compiler warning.",
    "answer": "False",
    "explanation": "Applying the unary minus operator to a non-numeric type results in a compiler error."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code.",
    "content": "int x = 5; int y = -x++;",
    "answer": "The bug is that the code is trying to modify a variable in a way that results in undefined behavior. The correct code should be either 'int x = 5; int y = -x; x++;' or 'int x = 5; x++; int y = -x;'.",
    "explanation": "The bug is due to the post-increment operator being applied to 'x' after it has been negated and assigned to 'y', resulting in undefined behavior."
  }
]
```