# 1. Technical Definition
The modulus operator, denoted as `mod` or `%`, is a binary operation that returns the remainder of an integer division operation, where the remainder is the amount left over after dividing the dividend by the divisor. Specifically, given two integers `a` and `b`, `a mod b` yields the integer `r` such that `a = b * q + r`, where `q` is the quotient and `0 ≤ r < |b|`.

# 2. Mental Model
Imagine you have 17 cookies and you want to put them into boxes that hold 5 cookies each. The modulus operator helps you figure out how many cookies will be left over after filling as many boxes as possible. In this case, 17 cookies divided into boxes of 5 leaves 2 cookies leftover, so 17 mod 5 equals 2.

# 3. Syntax Mechanics
* The modulus operator is often represented by the `%` symbol in programming languages.
* It takes two operands: the dividend (the number being divided) and the divisor (the number by which we are dividing).
* The result of `a % b` is always an integer between 0 (inclusive) and the absolute value of `b` (exclusive).
* The operator is commonly used in algorithms for tasks such as checking if a number is even or odd, or for wrapping around a circular buffer.

# 4. Memory Lifecycle
* The modulus operation does not change the original values of the operands.
* The result of a modulus operation is always non-negative, even if the dividend or divisor is negative.
* Division by zero using the modulus operator is undefined and typically results in an error.
* The range of values that can be represented by the result of a modulus operation depends on the data type of the operands.

read: true
---

## 5. Worked Example

```cpp
#include <iostream>

int main() {
    int dividend = 17;
    int divisor = 5;
    int remainder = dividend % divisor;
    std::cout << "The remainder of " << dividend << " divided by " << divisor << " is: " << remainder << std::endl;
    return 0;
}
```

### Execution Walkthrough
1. The program includes the necessary iostream library for input/output operations.
2. In the main function, two integer variables `dividend` and `divisor` are declared and initialized with values 17 and 5, respectively.
3. The modulus operator `%` is applied to `dividend` and `divisor`, and the result is stored in the variable `remainder`.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the result of 17 mod 5?

**Implementation Challenge**: Write a C++ program that calculates the remainder of a user-provided dividend and divisor.

**Debug Challenge**: Find the bug in the following code: `int remainder = 10 % 0;`

---

### Answer Key
- L1_SCENARIO: 2
- L2_IMPLEMENTATION: A correct implementation would involve using the modulus operator `%` to calculate the remainder, similar to the provided artifact, but with user input.
- L3_DEBUG: The bug in the code is division by zero, which is undefined and will result in a runtime error. To fix, ensure the divisor is not zero before performing the modulus operation.