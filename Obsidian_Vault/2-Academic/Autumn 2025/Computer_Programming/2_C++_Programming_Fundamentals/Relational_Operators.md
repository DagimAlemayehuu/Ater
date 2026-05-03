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
Imagine you're comparing the number of cookies you have with the number of cookies your friend has. Relational operators are like the questions you ask to determine if you have more, less, or the same number of cookies as your friend. For example, "Do I have the same number of cookies as my friend?" is like using the `==` operator.

# 2. Execution Logic & Data Flow
Relational operators in C++ are used to compare two operands and return a boolean value indicating the result of the comparison. When a relational operator is encountered, the [[Compiler]] generates [[Machine_Code]] that performs the comparison. For instance, the `==` operator checks if the values of two operands are equal, and if so, it returns `true`. The comparison is done by evaluating the [[Expression_Tree]] formed by the operands and the operator. The result of the comparison is then stored in a [[Stack_Frame]].

# 3. Edge Cases & Failure States
When using relational operators, edge cases such as [[Nan]] (Not a Number) values can lead to unexpected results. For example, comparing a `NaN` value with any other value using the `==` operator will result in `false`. Additionally, when comparing [[Floating_Point]] numbers, issues like [[Rounding_Errors]] can occur due to the way numbers are represented in memory. It's also important to consider the [[Operator_Precedence]] when combining multiple relational operators in a single expression, as this can affect the order in which the comparisons are evaluated.
# 4. Implementation Mechanics
```cpp
#include <iostream>

int main() {
    int a = 5;
    int b = 3;

    bool isEqual = (a == b);  // Equality operator
    bool isNotEqual = (a != b);  // Inequality operator
    bool isGreater = (a > b);  // Greater than operator
    bool isLess = (a < b);  // Less than operator
    bool isGreaterOrEqual = (a >= b);  // Greater than or equal to operator
    bool isLessOrEqual = (a <= b);  // Less than or equal to operator

    std::cout << std::boolalpha;
    std::cout << "Is a equal to b? " << isEqual << std::endl;
    std::cout << "Is a not equal to b? " << isNotEqual << std::endl;
    std::cout << "Is a greater than b? " << isGreater << std::endl;
    std::cout << "Is a less than b? " << isLess << std::endl;
    std::cout << "Is a greater than or equal to b? " << isGreaterOrEqual << std::endl;
    std::cout << "Is a less than or equal to b? " << isLessOrEqual << std::endl;

    return 0;
}
```
This C++ code demonstrates the use of relational operators (`==`, `!=`, `>`, `<`, `>=` , `<=`) to compare two integers `a` and `b`. The results of these comparisons are stored in boolean variables and then printed to the console.

The code can be read by understanding the variables `a` and `b` as the operands, and the relational operators as the comparisons being made. The results of these comparisons are then outputted.

## 5. Walkthrough
Here's a step-by-step walkthrough of a scenario applying relational operators:

1. **Given Data**: Suppose we have two variables, `studentGrade` and `passingGrade`, with values `85` and `80` respectively.
2. **Objective**: Determine if a student has passed based on their grade.
3. **Step 1**: Compare `studentGrade` with `passingGrade` using the greater than or equal to operator (`>=`).
4. **Calculation**: `studentGrade >= passingGrade` translates to `85 >= 80`.
5. **Evaluation**: Since $85 \geq 80$ is true, the result of the comparison is `true`.
6. **Decision**: Based on the result (`true`), we conclude that the student has passed.
7. **Intermediate State**: The comparison result (`true`) is stored in a boolean variable, say `hasPassed`.
8. **Final Outcome**: The program can then proceed based on the value of `hasPassed`, for example, printing "Congratulations, you passed!".

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The relational operator used to check if two values are equal is [[Blank1]].",
    "textWithBlanks": "The [[Blank1]] operator checks for equality.",
    "answer": [
      "=="
    ],
    "explanation": "The equality operator in C++ is denoted by '=='."
  },
  {
    "id": "q2",
    "type": "True_False",
    "difficulty": "L2",
    "question": "The expression 5 >= 5 evaluates to False.",
    "answer": "False",
    "explanation": "The expression $5 \\geq 5$ is True because 5 is indeed greater than or equal to 5."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code snippet.",
    "content": "bool isValid = (age < 18); // intended to check if age is greater than or equal to 18",
    "answer": "The bug is that the code checks if age is less than 18, but it should check if age is greater than or equal to 18. The correct code should be: bool isValid = (age >= 18);",
    "explanation": "The original code checks for the opposite condition of what is intended."
  }
]
```