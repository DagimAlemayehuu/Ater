# 1. Technical Definition
Relational operators are used to compare two operands and return a Boolean value indicating the relationship between them, such as `==` (equal to), `!=` (not equal to), `>` (greater than), `<` (less than), `>=` (greater than or equal to), and `<=` (less than or equal to). These operators are essential in programming for making decisions and controlling the flow of a program based on conditions.

# 2. Mental Model
Imagine you have a bunch of boxes with different numbers of candies inside. Relational operators are like comparing the number of candies in two boxes to see if they are equal, or if one has more or less than the other. For example, if Box A has 5 candies and Box B has 3 candies, the "greater than" operator would say Box A has more candies than Box B.

# 3. Syntax Mechanics
* Relational operators compare two operands (values or variables) and return a Boolean result (`true` or `false`).
* Common relational operators include `==` (equal to), `!=` (not equal to), `>` (greater than), `<` (less than), `>=` (greater than or equal to), and `<=` (less than or equal to).
* These operators are often used in conditional statements (`if`, `while`, etc.) to make decisions based on the comparison result.
* The order of operands matters in relational operators, as `a > b` is not the same as `b > a`.

# 4. Memory Lifecycle
* Relational operators do not affect memory allocation directly.
* However, the result of a relational operation (a Boolean value) typically requires a small amount of memory to store.
* The operands being compared must be of compatible data types; otherwise, the compiler or interpreter may raise an error or perform implicit type conversions.
* Overusing relational operators within loops or complex conditions can impact performance, but this is usually negligible unless dealing with extremely large datasets or performance-critical code.

mode: "CS-CODE"
---

## 5. Worked Example

```cpp
#include <iostream>

int main() {
    int a = 5;
    int b = 3;

    std::cout << std::boolalpha;
    std::cout << "a == b: " << (a == b) << std::endl;
    std::cout << "a != b: " << (a != b) << std::endl;
    std::cout << "a > b: " << (a > b) << std::endl;
    std::cout << "a < b: " << (a < b) << std::endl;
    std::cout << "a >= b: " << (a >= b) << std::endl;
    std::cout << "a <= b: " << (a <= b) << std::endl;

    return 0;
}
```

### Execution Walkthrough
1. The program starts by including the necessary `iostream` header for input/output operations.
2. In the `main` function, two integer variables `a` and `b` are declared and initialized with values 5 and 3, respectively.
3. The program then uses relational operators to compare `a` and `b`, printing the results of each comparison.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the output of the expression `5 > 3` in C++?

**Implementation Challenge**: Write a C++ program that uses relational operators to determine if a given age is eligible to vote (assuming the voting age is 18).

**Debug Challenge**: Find the bug in the following code snippet: `if (x = 5) { std::cout << "x is equal to 5"; }`. What is the intended behavior, and how can it be fixed?

---

### Answer Key
- L1_SCENARIO: The output of the expression `5 > 3` in C++ is `true`.
- L2_IMPLEMENTATION:
```cpp
#include <iostream>

int main() {
    int age;
    std::cout << "Enter your age: ";
    std::cin >> age;

    if (age >= 18) {
        std::cout << "You are eligible to vote." << std::endl;
    } else {
        std::cout << "You are not eligible to vote." << std::endl;
    }

    return 0;
}
```
- L3_DEBUG: The bug in the code snippet `if (x = 5) { std::cout << "x is equal to 5"; }` is that it uses a single equals sign (`=`) for assignment instead of a double equals sign (`==`) for comparison. The intended behavior is to check if `x` is equal to 5. The fixed code should be: `if (x == 5) { std::cout << "x is equal to 5"; }`.