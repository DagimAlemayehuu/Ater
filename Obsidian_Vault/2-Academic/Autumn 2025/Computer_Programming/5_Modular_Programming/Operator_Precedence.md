---
title: Operator Precedence
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 2.Pdf]]"
source_pages: []
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Arithmetic Operators]]"
---

# 1. Technical Definition
Operator precedence is a set of rules that defines the order in which operators are evaluated when there are multiple operators in an expression, specifically determining which `operator` takes precedence over others. The `precedence` of an operator determines how it is grouped with operands and other operators in an expression.

# 2. Mental Model
Imagine you're following a recipe that has multiple steps, like adding and multiplying ingredients. Operator precedence is like a set of instructions that tells you which steps to do first, so you do the multiplication before addition, just like following a specific order to get the right result.

# 3. Syntax Mechanics
* The precedence of operators determines the order in which they are evaluated.
* Operators with higher precedence are evaluated before operators with lower precedence.
* When operators have the same precedence, their associativity (left-to-right or right-to-left) determines the order of evaluation.
* Parentheses can override operator precedence by grouping expressions.

# 4. Memory Lifecycle
* The number of operators in an expression can affect how quickly it is evaluated, with too many operators potentially leading to slower performance.
* The precedence of operators can affect how expressions are stored in memory, with some operators requiring more memory to evaluate than others.
* Expressions with multiple operators can be limited by the maximum recursion depth or stack size.
* Some operators have specific requirements or constraints on their operands, such as division by zero.

---

## 5. Worked Example

```cpp
#include <iostream>

int main() {
    int a = 5;
    int b = 3;
    int c = 2;

    // Expression with multiple operators
    int result = a + b * c;

    std::cout << "Result: " << result << std::endl;

    return 0;
}
```

### Execution Walkthrough
1. The program starts by declaring and initializing three integer variables: `a`, `b`, and `c`.
2. The expression `int result = a + b * c;` is evaluated. According to operator precedence rules in C++, the `*` operator has higher precedence than the `+` operator.
3. Therefore, `b * c` is evaluated first, resulting in `3 * 2 = 6`.
4. Then, `a + 6` is evaluated, resulting in `5 + 6 = 11`.
5. The final result, `11`, is stored in the `result` variable and printed to the console.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the order of operations in the expression `a + b * c` based on operator precedence rules in C++?

**Implementation Challenge**: Given the expression `int result = a + b * c;`, how would you rewrite it to explicitly show the order of operations using parentheses?

**Debug Challenge**: Find the bug in the expression `int result = a * b / c;` assuming `a`, `b`, and `c` are integers and `c` might be zero.

---

### Answer Key
- L1_SCENARIO: The order of operations is that the multiplication (`*`) is evaluated first, followed by the addition (`+`).
- L2_IMPLEMENTATION: The expression can be rewritten as `int result = a + (b * c);` to explicitly show the order of operations.
- L3_DEBUG: The bug in the expression `int result = a * b / c;` is a potential division by zero error if `c` is zero. To fix it, add a check to ensure `c` is not zero before performing the division.