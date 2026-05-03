---
title: Modulus_Operator
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '2'
hub: "[[2_C++_Programming_Fundamentals_Hub]]"
source: "[[Chapter 2.Pdf]]"
source_pages:
- 39
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you have a jar of 5 cookies, and you want to package them into bags of 2 cookies each. The modulus operator helps you find out how many cookies are left over after filling as many bags as possible. In this case, you can fill 2 bags with 4 cookies, and you'll have 1 cookie left over. This leftover amount is what the modulus operator gives you.

# 2. Execution Logic & Data Flow
The modulus operator, denoted by the `%` symbol, calculates the remainder of an integer division operation. Mechanically, when you evaluate an expression like `-5 % 2`, the [[Integer_Division]] operation `-5 / 2` yields `-2` with a remainder of `-1`, but due to the [[C++_Implementation]] of the modulus operator, it actually produces a result with the same sign as the divisor, which is `2` in this case, resulting in `1`. This behavior follows from the [[Operator_Precedence]] rules and the [[Stack_Frame]] management in the C++ compiler. Specifically, the expression `-5 % 2` is evaluated as `(-5) % 2`, not as `-(5 % 2)`.

# 3. Edge Cases & Failure States
When using the modulus operator, you need to consider edge cases such as division by zero, which results in a [[Division_By_Zero]] error. Additionally, the modulus operator's behavior with negative numbers can be counterintuitive, as seen in the example `-5 % 2`. The [[C++_Standard]] defines the result of the modulus operator for negative numbers to have the same sign as the divisor. Another constraint is that the modulus operator is only defined for integer types, and attempting to use it with floating-point numbers will result in a [[Type_Mismatch]] error. For example, the expression `5.5 % 2.2` is not well-formed in C++.
# 4. Implementation Mechanics
```cpp
int modulus_example(int dividend, int divisor) {
    if (divisor == 0) {
        throw std::runtime_error("Division by zero");
    }
    return dividend % divisor;
}
```
This C++ code defines a function `modulus_example` that calculates the remainder of `dividend` divided by `divisor` using the modulus operator `%`. It also includes a check to ensure that the `divisor` is not zero, throwing a `std::runtime_error` if it is.

The code can be understood by reading it as follows: The function takes two integer parameters, `dividend` and `divisor`, and returns their remainder. If the `divisor` is zero, it throws an exception.

```
  +---------------+
  |  Stack Frame  |
  +---------------+
  |  dividend    |
  |  divisor     |
  |  return value|
  +---------------+
           |
           |
           v
  +---------------+
  |  Modulus Op   |
  |  (dividend %  |
  |   divisor)    |
  +---------------+
```

## 5. Walkthrough
Here's a step-by-step walkthrough of using the modulus operator:

1. Suppose we want to calculate the remainder of 17 divided by 5.
2. The division operation `17 / 5` yields 3 with a remainder of 2.
3. The modulus operator `17 % 5` returns the remainder, which is 2.
4. Now, let's consider a case with negative numbers: `-17 % 5`.
5. The division operation `-17 / 5` yields -3 with a remainder of -2, but due to the C++ implementation, the result is `-17 % 5 == -2`.
6. Finally, consider the edge case of division by zero: `17 % 0`. This should throw a `std::runtime_error` exception.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "The modulus operator [[Blank1]] calculates the remainder of an integer division operation.",
    "textWithBlanks": "The modulus operator [[Blank1]] calculates the remainder of an integer division operation.",
    "answer": [
      "%"
    ],
    "explanation": "The modulus operator is denoted by the % symbol."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "The expression `-5 % 2` evaluates to `-1`.",
    "answer": "False",
    "explanation": "The expression `-5 % 2` evaluates to `1` in C++."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code.",
    "content": "int buggy_modulus(int dividend, int divisor) { return dividend % divisor; }",
    "answer": "The bug is that the function does not check for division by zero.",
    "explanation": "The function should throw an exception when the divisor is zero."
  }
]
```