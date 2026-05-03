---
title: Type_Conversion
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '2'
hub: "[[2_C++_Programming_Fundamentals_Hub]]"
source: "[[Chapter 2.Pdf]]"
source_pages:
- 49
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you have a toy box where you store different types of toys, like blocks and dolls. Type conversion is like taking a toy from one box and putting it into another box where it can be played with in a different way, but it still remains the same toy. For example, if you have a block that represents the number 5, you might want to put it into a box where it can be used as a text label, so it becomes the string "5".

# 2. Execution Logic & Data Flow
Type conversion in C++ involves changing the [[Data_Type]] of a variable or expression from one type to another. This can occur implicitly, through [[Implicit_Conversion]], or explicitly, through [[Casting]]. When a value is assigned to a variable of a different type, the compiler will attempt to perform an implicit conversion if possible. For instance, assigning an `int` value to a `double` variable will result in a promotion to `double`. On the other hand, explicit casting involves using the cast operator, such as `static_cast`, to convert a value from one type to another, like `double` to `int`. The [[Stack_Frame]] is not directly involved in type conversion, but the compiler will manage the [[Memory_Layout]] of variables during the conversion process. The [[Operator_Precedence]] rules also come into play when evaluating expressions involving mixed types.

# 3. Edge Cases & Failure States
When performing type conversions, there are several edge cases to consider. For example, converting a `double` value to an `int` using a cast will truncate the fractional part, potentially leading to loss of precision. Additionally, converting a large integer value to a smaller type, like `char`, may result in [[Integer_Overflow]] or [[Underflow]]. It's also important to be aware of [[Undefined_Behavior]] when converting between types in a way that is not well-defined, such as converting a negative value to an unsigned type. Furthermore, [[Type_Limits]] must be considered to ensure that the converted value falls within the valid range for the target type.
# 4. Implementation Mechanics
```cpp
#include <iostream>

int main() {
    double doubleValue = 5.5;
    int intValue = static_cast<int>(doubleValue);
    std::cout << "intValue: " << intValue << std::endl;

    int intValue2 = 10;
    double doubleValue2 = static_cast<double>(intValue2);
    std::cout << "doubleValue2: " << doubleValue2 << std::endl;

    return 0;
}
```
This C++ code demonstrates explicit type conversion using `static_cast`. The `double` value `5.5` is converted to an `int`, truncating the fractional part, and the `int` value `10` is converted to a `double`.

To read this code: The code includes necessary headers, defines a `main` function, and performs two type conversions. The first conversion takes a `double` value and assigns it to an `int` variable using `static_cast`, effectively truncating the decimal part. The second conversion takes an `int` value and assigns it to a `double` variable, which results in a promotion.

## 5. Walkthrough
Here's a step-by-step walkthrough of the type conversion process:

1. `double doubleValue = 5.5;` - A `double` variable `doubleValue` is initialized with the value `5.5`.
2. `int intValue = static_cast<int>(doubleValue);` - The `double` value `5.5` is converted to an `int` using `static_cast`. The fractional part `.5` is truncated, resulting in `intValue` being assigned the value `5`.
3. `int intValue2 = 10;` - An `int` variable `intValue2` is initialized with the value `10`.
4. `double doubleValue2 = static_cast<double>(intValue2);` - The `int` value `10` is converted to a `double` using `static_cast`. Since `int` can be promoted to `double`, this results in `doubleValue2` being assigned the value `10.0`.
5. The converted values are printed to the console.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "Type conversion in C++ can occur [[Implicitly]] or [[Explicitly]] through [[Casting]].",
    "textWithBlanks": "Type conversion in C++ can occur [[Blank1]] or [[Blank2]] through [[Blank3]].",
    "answer": [
      "implicitly",
      "explicitly",
      "casting"
    ],
    "explanation": "Type conversion can occur in two ways: implicitly, where the compiler attempts to convert the value, or explicitly, through the use of cast operators."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "Converting a double value to an int using a cast will always result in a loss of precision.",
    "answer": "True",
    "explanation": "When converting a double value to an int, the fractional part is truncated, which can lead to a loss of precision."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code.",
    "content": "int main() {\n    int intValue = 2147483647;\n    unsigned int uintValue = intValue;\n    return 0;\n}",
    "answer": "The bug is that the assignment of a large integer value to an unsigned int may result in integer overflow or underflow. The fix is to ensure that the assigned value is within the valid range for the unsigned int type.",
    "explanation": "The code assigns a large integer value to an unsigned int, which can result in integer overflow or underflow. To fix this, we should ensure that the assigned value is within the valid range for the unsigned int type."
  }
]
```