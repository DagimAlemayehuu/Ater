---

title: Keywords
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '2'
hub: "[[2_C++_Programming_Fundamentals_Hub]]"
source: "[[Chapter_2.pdf]]"
source_pages:
- 17
mode: CS-SOFTWARE
read: false
generated: true

---

# 1. Mental Model

The concept of keywords in programming can be likened to reserved seats in a theater, where certain seats have specific designations, such as "exit" or "reserved for handicapped," and cannot be occupied by just anyone. These reserved seats, or keywords, have a predefined meaning that cannot be changed. Just as the reserved seats serve a specific purpose in the theater, keywords serve a specific purpose in the compiler.

# 2. Execution Logic & Data Flow

The [[C++_Programming_Language]] utilizes [[Keywords]] to provide a predefined meaning that cannot be changed by the programmer. When a [[C++_Program_Structure]] is compiled, the [[Compiler_Directives]] and [[Preprocessor_Directives]] are processed, and the [[Main_Function]] is executed, which may include [[Statements]] that use [[Keywords]] to perform specific operations. The [[C++_Is_Case_Sensitive]] nature of the language means that keywords must be used exactly as defined. The [[Stream_Insertion_Operator]] and [[Arithmetic_Operators]] are examples of operators that work with [[Variables]] and [[Literals]], which are often declared using [[Variable_Declaration]] and must adhere to [[Operator_Precedence]] and [[Associativity]]. The [[Keywords]] are an essential part of the [[Basic_Elements]] of the language.

# 3. Edge Cases & Failure States

When a programmer attempts to use a [[Keyword]] as an [[Identifier]], the program will fail to compile, resulting in an error message indicating that the keyword is reserved. Similarly, if a [[Keyword]] is misspelled or used in a context where it is not valid, the program may not compile or may produce unexpected results due to [[Type_Casting]] or [[Expression]] evaluation issues. In cases where [[Keywords]] are used incorrectly, the [[Compiler_Directives]] may not be processed correctly, leading to [[Return_Statement]] issues or incorrect [[Division_Operator]] and [[Modulus_Operator]] results. Furthermore, incorrect use of [[Keywords]] can lead to issues with [[Logical_Operators]] and [[Assignment_Operator]] precedence.

## 4. Implementation Mechanics

```cpp

#include <iostream>
#include <string>
#include <unordered_map>

// Define a map to store keywords
std::unordered_map<std::string, std::string> keywords = {
    {"if", "conditional statement"},
    {"else", "conditional statement"},
    {"for", "loop statement"},
    {"while", "loop statement"},
    {"class", "object-oriented programming"},
    {"try", "exception handling"}
};

void checkKeyword(const std::string& word) {
    if (keywords.find(word) != keywords.end()) {
        std::cout << word << " is a keyword: " << keywords[word] << std::endl;
    } else {
        std::cout << word << " is not a keyword." << std::endl;
    }
}

int main() {
    checkKeyword("if");
    checkKeyword("else");
    checkKeyword("for");
    checkKeyword("while");
    checkKeyword("class");
    checkKeyword("try");
    checkKeyword("hello");
    return 0;
}

```

Memory/Stack Diagram:

```

  +---------------+

  |  keywords    |

  |  (unordered  |

  |   map)       |

  +---------------+
           |
           |
           v
  +---------------+

  |  checkKeyword |

  |  (function)   |

  +---------------+
           |
           |
           v
  +---------------+

  |  main        |

  |  (function)   |

  +---------------+

```

The code block represents a C++ program that checks if a given word is a keyword, and the ASCII memory/stack diagram illustrates the memory layout of the program, showing the `keywords` map, the `checkKeyword` function, and the `main` function. The program uses an unordered map to store keywords and their meanings, and the `checkKeyword` function checks if a given word is in the map.

## 5. Walkthrough

1. The program starts by defining an unordered map `keywords` that stores keywords and their meanings.
2. The `checkKeyword` function is called with the argument `"if"`, which is found in the `keywords` map, so it prints: `if is a keyword: conditional statement`.
3. The `checkKeyword` function is called with the argument `"hello"`, which is not found in the `keywords` map, so it prints: `hello is not a keyword.`.
4. The program then calls `checkKeyword` with the arguments `"else"`, `"for"`, `"while"`, `"class"`, and `"try"`, each of which is found in the `keywords` map, and prints their corresponding meanings.
5. The `main` function returns 0, indicating successful execution of the program.
6. The program terminates, and the memory allocated for the `keywords` map and the `checkKeyword` and `main` functions is deallocated.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {"id":"q1","type":"fill_in","difficulty":"L1","question":"In C++, the [[Blank1]] are reserved and cannot be used as variable names.","textWithBlanks":"In C++, the [[Blank1]] are reserved and cannot be used as variable names.","answer":["keywords"],"explanation":"Keywords in C++ have a predefined meaning and cannot be used as variable names."},
  {"id":"q2","type":"true_false","difficulty":"L2","question":"In C++, the keyword \\'try\\' is used to define a block of code where exceptions can occur, and it can be immediately followed by a \\'catch\\' block without an intervening statement.","answer":true,"explanation":"The try block is used to enclose code that might throw an exception, and it can be immediately followed by a catch block."},
  {"id":"q3","type":"debug","difficulty":"L3","question":"Find bug.","content":"int findMax(int arr[], int size) { int max = arr[0]; for (int i = 1; i \\< size; i++) { if (arr[i] \\< max) { max = arr[i]; } } return max; }","answer":"The condition in the if statement should be \\'if (arr[i] \\> max)\\'","explanation":"The bug in the code is that it is currently finding the minimum value in the array instead of the maximum value."}
]

```