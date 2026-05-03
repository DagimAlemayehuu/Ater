---

title: Identifiers
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '2'
hub: "[[2_C++_Programming_Fundamentals_Hub]]"
source: "[[Chapter_2.pdf]]"
source_pages:
- 19
mode: CS-SOFTWARE
read: false
generated: true

---

# 1. Mental Model

A programmer's choice of [[Identifiers]] can be likened to naming ships, where each name must be unique and follow specific maritime conventions to avoid confusion. Just as ship names are carefully chosen to reflect their purpose and origin, [[Identifiers]] in code are selected to convey their role and scope. A well-chosen identifier navigates the complexities of code readability and maintainability.

# 2. Execution Logic & Data Flow

The process of defining and using [[Identifiers]] in a C++ program involves a series of steps that start with the [[Variable_Declaration]], where a programmer assigns a name to a variable, function, or class. This name, or [[Identifier]], must adhere to specific rules, such as beginning with a letter or underscore and consisting only of letters, digits, and underscores. The [[C++_Programming_Language]] is case-sensitive, so [[Identifiers]] like "myVariable" and "myvariable" would be treated as distinct. When writing code, [[White_Space]] and [[Braces]] help organize the structure, but do not affect the validity of [[Identifiers]]. The [[Compiler_Directives]] and [[Preprocessor_Directives]] also play a role in how [[Identifiers]] are interpreted during the compilation process.

# 3. Edge Cases & Failure States

When choosing [[Identifiers]], programmers must avoid using [[Keywords]] and ensure that they do not duplicate existing [[Identifiers]] within the same scope, as this can lead to naming conflicts. If an [[Identifier]] is misspelled or not declared before use, the compiler will throw an error, highlighting the importance of careful naming and [[Type_Casting]] practices. Furthermore, while [[Literals]] and [[Variables]] can be used to initialize [[Identifiers]], using reserved names can cause issues with [[Operator_Precedence]] and [[Associativity]], ultimately affecting the program's logic flow. A failure to properly manage [[Identifiers]] can result in code that is difficult to debug and maintain.

## 4. Implementation Mechanics

```cpp

#include <iostream>
#include <string>

int main() {
    // Declare and initialize variables
    int shipId = 123;
    std::string shipName = "Navigator";

    // Use variables
    std::cout << "Ship ID: " << shipId << std::endl;
    std::cout << "Ship Name: " << shipName << std::endl;

    return 0;
}

```

Memory/Stack Diagram:

```

  +---------------+

  |  shipId (int)  |

  |  Value: 123    |

  +---------------+

  |  shipName (str) |

  |  Value: "Navigator" |

  +---------------+

  |  (empty stack)  |

  +---------------+

```

The code block represents the C++ program that declares and uses variables, while the ASCII memory/stack diagram illustrates the memory layout of the variables. The diagram shows the variables `shipId` and `shipName` stored in memory with their respective values.

## 5. Walkthrough

1. The program starts with the declaration of two variables, `shipId` and `shipName`, which are initialized with the values `123` and `"Navigator"`, respectively.
2. The variables are stored in memory, with `shipId` occupying an integer-sized space with the value `123`, and `shipName` occupying a string-sized space with the value `"Navigator"`.
3. The program then uses the `std::cout` statement to print the value of `shipId` to the console, which outputs `Ship ID: 123`.
4. Next, the program uses the `std::cout` statement to print the value of `shipName` to the console, which outputs `Ship Name: Navigator`.
5. As the program executes, the call stack remains empty since there are no function calls.
6. The program terminates, and the memory occupied by the variables `shipId` and `shipName` is released.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {"id":"q1","type":"fill_in","difficulty":"L1","question":"A programmer's choice of [[Identifiers]] can be likened to naming ships, where each name must be unique and follow specific maritime conventions to avoid confusion. The term for a name given to a variable, function, or class in code is an [[Identifier]].","textWithBlanks":"A programmer's choice of [[Identifiers]] can be likened to naming ships, where each name must be unique and follow specific maritime conventions to avoid confusion. The term for a name given to a variable, function, or class in code is an [[Identifier]].","answer":["identifier"],"explanation":"An identifier is a name given to a variable, function, or class in code."},
  {"id":"q2","type":"true_false","difficulty":"L2","question":"In C++, an identifier can start with a digit.","answer":false,"explanation":"In C++, an identifier cannot start with a digit, but can contain digits."},
  {"id":"q3","type":"debug","difficulty":"L3","question":"Find bug.","content":"int x = 1; int y = x / 0;","answer":"Division by zero","explanation":"The bug is a division by zero error, which will cause a runtime exception."}
]

```