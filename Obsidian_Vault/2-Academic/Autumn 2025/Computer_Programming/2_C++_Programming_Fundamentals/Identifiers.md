---
title: Identifiers
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '2'
hub: "[[2_C++_Programming_Fundamentals_Hub]]"
source: "[[Chapter 2.Pdf]]"
source_pages:
- 19
mode: CS-SOFTWARE
read: false
generated: true
---

# 1. Mental Model
Think of identifiers like the names on your school lockers. Just as your name on the locker helps you and your teachers identify which locker belongs to you, an identifier in programming helps the computer understand which variable, function, or class you're referring to. This name is given by the programmer and must be unique within its scope.

# 2. Execution Logic & Data Flow
Identifiers are resolved during the [[Compilation_Process]] or [[Interpretation_Process]], where the [[Symbol_Table]] is used to map the identifier to its corresponding memory location or definition. When a programmer uses an identifier in their code, the compiler or interpreter checks the [[Scope_Resolution]] rules to determine which definition the identifier refers to. The identifier is then replaced with its memory address or reference, allowing the program to access the associated data or function. The [[Lexer]] and [[Parser]] components of the compiler or interpreter are responsible for tokenizing and analyzing the identifiers in the source code.

# 3. Edge Cases & Failure States
Identifiers must follow specific naming conventions, such as starting with a letter or underscore, and cannot be a [[Reserved_Word]] in the programming language. If an identifier is misspelled or used out of scope, the compiler or interpreter will raise a [[Syntax_Error]] or [[Undefined_Reference]] error. Additionally, if two identifiers with the same name are declared in the same scope, the compiler will report a [[Duplicate_Definition]] error. Identifiers are case-sensitive in some languages, so `variable` and `Variable` would be treated as two different identifiers.
# 4. Implementation Mechanics
```python
# Annotated AST snippet for identifier resolution
class Identifier:
    def __init__(self, name, scope):
        self.name = name
        self.scope = scope

class Variable(Identifier):
    def __init__(self, name, scope, data_type):
        super().__init__(name, scope)
        self.data_type = data_type

# Example usage:
variable_x = Variable("x", "global", "int")
symbol_table = {
    "global": {
        "x": variable_x
    }
}

def resolve_identifier(identifier_name, scope):
    # Simplified scope resolution logic
    if scope in symbol_table:
        if identifier_name in symbol_table[scope]:
            return symbol_table[scope][identifier_name]
    return None

resolved_variable = resolve_identifier("x", "global")
print(resolved_variable.data_type)  # Output: int
```
To read this code: The provided Python code snippet demonstrates a basic implementation of identifier resolution using an Abstract Syntax Tree (AST) and a symbol table. It defines an `Identifier` class and a `Variable` subclass, then uses a `symbol_table` dictionary to map identifiers to their definitions.

## 5. Walkthrough
Here's a step-by-step walkthrough of how identifier resolution works:

1. **Identifier Declaration**: The programmer declares a variable `x` of type `int` in the global scope. The identifier "x" is created and stored in the symbol table with its corresponding memory location and data type.

2. **Symbol Table Update**: The symbol table is updated to include the new identifier "x" in the global scope.

   | Scope  | Identifier | Data Type |
   |--------|------------|-----------|
   | global | x          | int       |

3. **Identifier Usage**: The programmer uses the identifier "x" in their code, and the compiler or interpreter needs to resolve it.

4. **Scope Resolution**: The compiler or interpreter checks the scope resolution rules to determine which definition the identifier "x" refers to. In this case, it checks the global scope.

5. **Identifier Resolution**: The compiler or interpreter looks up the identifier "x" in the symbol table and finds a matching entry in the global scope.

6. **Memory Address Replacement**: The identifier "x" is replaced with its memory address, allowing the program to access the associated data.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "Identifiers must be [[Blank1]] within their scope.",
    "textWithBlanks": "Identifiers must be [[Blank1]] within their scope.",
    "answer": [
      "unique"
    ],
    "explanation": "Identifiers must be unique within their scope to avoid conflicts and ensure correct program execution."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "Identifiers are case-insensitive in all programming languages.",
    "answer": "False",
    "explanation": "Identifiers are case-sensitive in some programming languages, meaning that 'variable' and 'Variable' would be treated as two different identifiers."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the identifier resolution logic.",
    "content": "def resolve_identifier(identifier_name, scope):\n  if scope in symbol_table:\n    if identifier_name in symbol_table[scope]:\n      return symbol_table[scope][identifier_name]\n  return None\n\nsymbol_table = {\n  'global': {\n    'x': 'int'\n  }\n}\n\nprint(resolve_identifier('y', 'global'))  # Should print 'int'",
    "answer": "The bug is that the code does not handle the case when the identifier is not found in the symbol table. It should raise a SyntaxError or UndefinedReference error instead of returning None.",
    "explanation": "The provided code snippet does not handle the case when the identifier is not found in the symbol table. It simply returns None, which may lead to unexpected behavior or errors later in the program execution."
  }
]
```