---
title: Keywords
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '2'
hub: "[[2_C++_Programming_Fundamentals_Hub]]"
source: "[[Chapter 2.Pdf]]"
source_pages:
- 17
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Imagine you're trying to have a conversation with a robot, and there are certain words that the robot understands in a very specific way. These words are like secret commands that the robot responds to differently than regular conversation. In programming, these special words are called "keywords" and they're used to give instructions to the computer.

# 2. Execution Logic & Data Flow
Keywords are [[Reserved_Words]] that have a specific meaning to the compiler, and they're used to define the structure and syntax of a programming language. When the compiler encounters a keyword, it [[Lexical_Analysis|Lexically Analyzes]] the word and checks its [[Symbol_Table]] to determine its meaning and validity in the current context. The compiler then uses this information to generate [[Machine_Code]] that the computer can execute. Keywords are typically used to define [[Control_Structures]], such as `if` statements and `while` loops, and to declare [[Data_Types]], such as `int` and `float`.

# 3. Edge Cases & Failure States
When using keywords, programmers must be careful to avoid [[Syntax_Errors]] by using keywords correctly and avoiding conflicts with [[Identifier_Names]]. If a keyword is misused or redefined, the compiler may generate an error or produce unexpected behavior. Additionally, some keywords may have [[Context-Dependent_Meaning]], meaning that their meaning changes depending on the context in which they're used. For example, the `this` keyword in object-oriented programming languages can refer to different objects depending on the current [[Scope]] and [[Execution_Context]].
# 4. Implementation Mechanics
```python
# Annotated AST snippet for a simple if statement
IfStatement:
  - condition: BinaryExpression
    - left: Identifier (x)
    - operator: >
    - right: Literal (5)
  - body: BlockStatement
    - statements:
      - PrintStatement: Literal ("x is greater than 5")

# Lexical analysis and symbol table lookup
keywords = {"if": "IF_KEYWORD", "else": "ELSE_KEYWORD"}
symbol_table = {"x": "IDENTIFIER"}

def lexical_analysis(token):
  if token in keywords:
    return keywords[token]
  elif token in symbol_table:
    return symbol_table[token]
  else:
    return "UNKNOWN"

# Compiler execution
def compile_if_statement(condition, body):
  # Lexical analysis
  condition_tokens = [lexical_analysis(token) for token in condition]
  body_tokens = [lexical_analysis(token) for token in body]

  # Syntax analysis and code generation
  if condition_tokens[0] == "IDENTIFIER" and condition_tokens[1] == ">":
    # Generate machine code for if statement
    machine_code = "CMP x, 5; JG body"
  else:
    raise SyntaxError("Invalid if statement")

  return machine_code
```
To read this code, note that it shows a simplified annotated Abstract Syntax Tree (AST) snippet for an `if` statement, followed by a lexical analysis and symbol table lookup implementation. The `lexical_analysis` function checks if a token is a keyword or an identifier, and the `compile_if_statement` function generates machine code for the `if` statement based on the lexical analysis.

## 5. Walkthrough
Here's a rigorous, multi-step exam scenario applying the concept of keywords:

1. **Given code**: Suppose we have the following code snippet: `if (x > 5) { print("x is greater than 5"); }`
2. **Lexical analysis**: The compiler performs lexical analysis on the code and identifies the tokens: `if`, `(`, `x`, `>`, `5`, `)`, `{`, `print`, `(`, `"x is greater than 5"`, `)`, `;`, `}`
3. **Symbol table lookup**: The compiler looks up the tokens in the symbol table and determines that `x` is an identifier, `if` is a keyword, and `print` is a function.
4. **Syntax analysis**: The compiler performs syntax analysis on the tokens and determines that the code is a valid `if` statement.
5. **Code generation**: The compiler generates machine code for the `if` statement, which might look like: `CMP x, 5; JG body; body: PRINT "x is greater than 5"`

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "Keywords are [[Reserved_Words]] that have a specific meaning to the [[Compiler]].",
    "textWithBlanks": "Keywords are [[Blank1]] that have a specific meaning to the [[Blank2]].",
    "answer": [
      "Reserved Words",
      "compiler"
    ],
    "explanation": "Keywords are reserved words that have a specific meaning to the compiler."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "Keywords can be redefined by the programmer.",
    "answer": "False",
    "explanation": "Keywords typically cannot be redefined by the programmer, as they have a specific meaning to the compiler."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code: if (x > 5) { print(x); } else { }",
    "content": "def if_statement(x):\n  if x > 5:\n    print(x)\n  else:\n    pass",
    "answer": "The bug is that the 'else' clause is empty and does not handle the case where x <= 5. A fix could be to add a print statement or other logic to the else clause.",
    "explanation": "The bug is that the else clause is empty and does not handle the case where x <= 5."
  }
]
```