# 1. Technical Definition
Logical operators are used to combine relational expressions, and they are `AND`, `OR`, and `NOT` operators. The `AND` and `OR` operators are binary operators, while the `NOT` operator is a unary operator.

# 2. Mental Model
Imagine you have two boxes, one with a red ball and one with a blue ball. A logical operator is like a special rule that helps you decide which box to pick based on certain conditions. For example, if you want a box with a red ball **AND** it's sunny outside, you need both conditions to be true. If you want a box with a red ball **OR** a blue ball, you can pick either one.

# 3. Syntax Mechanics
* The `AND` operator returns `true` if both conditions are true.
* The `OR` operator returns `true` if at least one condition is true.
* The `NOT` operator reverses the result of a condition, i.e., `true` becomes `false` and vice versa.
* Logical operators can be combined to create more complex conditions.

# 4. Memory Lifecycle
* Logical operators have a short lifespan and are evaluated only when needed.
* The order of operations for logical operators is important, as it can affect the result.
* Logical operators can be used to create conditions that limit the number of iterations in a loop.
* Overusing logical operators can make code harder to read and understand.

generated: false
---

## 5. Worked Example

```cpp
#include <iostream>

int main() {
    bool isSunny = true;
    bool hasRedBall = true;
    bool hasBlueBall = false;

    // Using AND operator
    bool hasRedBallOnSunnyDay = isSunny && hasRedBall;
    std::cout << "Has red ball on sunny day: " << std::boolalpha << hasRedBallOnSunnyDay << std::endl;

    // Using OR operator
    bool hasEitherBall = hasRedBall || hasBlueBall;
    std::cout << "Has either ball: " << std::boolalpha << hasEitherBall << std::endl;

    // Using NOT operator
    bool doesNotHaveBlueBall = !hasBlueBall;
    std::cout << "Does not have blue ball: " << std::boolalpha << doesNotHaveBlueBall << std::endl;

    return 0;
}
```

### Execution Walkthrough
1. The program starts by declaring three boolean variables: `isSunny`, `hasRedBall`, and `hasBlueBall`, and initializing them with specific values.
2. It then uses the `AND` operator (`&&`) to evaluate the condition `isSunny && hasRedBall` and stores the result in `hasRedBallOnSunnyDay`.
3. The program uses the `OR` operator (`||`) to evaluate the condition `hasRedBall || hasBlueBall` and stores the result in `hasEitherBall`.
4. Finally, it uses the `NOT` operator (`!`) to reverse the value of `hasBlueBall` and stores the result in `doesNotHaveBlueBall`.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the result of the expression `true && false`?

**Implementation Challenge**: Write a C++ code snippet that checks if a person is eligible to vote based on their age being greater than or equal to 18 and having a valid ID.

**Debug Challenge**: Find the bug in the following code: `bool isValid = true || false && !true;` and explain how to fix it.

---

### Answer Key
* L1_SCENARIO: The result of the expression `true && false` is `false`.
* L2_IMPLEMENTATION:
```cpp
bool isEligibleToVote(int age, bool hasValidID) {
    return age >= 18 && hasValidID;
}
```
* L3_DEBUG: The bug in the code is due to the order of operations. The expression `true || false && !true` is evaluated as `true || (false && !true)`, which is equivalent to `true || (false && false)`, resulting in `true`. However, if the intention was to check if `true` and `!true` are both true, the correct code should be `(true && !true) || false`, which would evaluate to `false`. To fix it, add parentheses to ensure the correct order of operations: `bool isValid = (true || false) && !true;` or use the intended logic with proper parentheses.