---
title: Function Declaration
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages: []
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Functions In C++]]"
---

# 1. Technical Definition
A `function declaration` is a statement that defines a function with a specified `identifier`, `parameter list`, and `function body`, allowing for the creation of a named function that can be invoked multiple times throughout a program. The syntax for a function declaration is formally defined as `function FunctionDeclaration { [FunctionBody] }`, where `FunctionBody` is a sequence of statements enclosed in curly brackets.

# 2. Syntax Mechanics
* A function declaration begins with the `function` keyword, followed by an `Identifier` that serves as the function's name.
* The `parameter list` is enclosed in parentheses and consists of one or more `FormalParameter` elements, which are separated by commas.
* The `function body` is a sequence of statements enclosed in curly brackets, which defines the code that is executed when the function is invoked.
* The `function declaration` is a complete statement and must be terminated with a semicolon.

# 3. Memory Lifecycle
* A function declaration is `hoisted` to the top of its scope, allowing it to be invoked before it is formally declared.
* The `function body` is executed in the context of its own scope, which is separate from the surrounding scope.
* A function declaration has a `[[Functiondefinition]]` internal slot, which contains the function's `FormalParameters`, `FunctionBody`, and `LexicalScope`.
* The `function declaration` is subject to the constraints of the `VariableEnvironment` and `LexicalEnvironment` records, which govern the binding of variables and functions to their respective scopes.

---

## 4. Worked Example

```cpp
// Function declaration with identifier, parameter list, and function body
void greet(const std::string& name) {
    std::cout << "Hello, " << name << std::endl;
}

// Function declaration with multiple parameters
int add(int a, int b) {
    return a + b;
}

// Function declaration with no parameters
void sayHello() {
    std::cout << "Hello!" << std::endl;
}
```

---

## 5. Knowledge Check

```interactive-quiz
[
  {
    "id": "q1",
    "type": "code",
    "difficulty": "L1",
    "question": "What is the syntax for a basic function declaration in C++?",
    "codeSnippet": "void functionName() { /* function body */ }",
    "answer": "void functionName() { /* function body */ }",
    "explanation": "A basic function declaration in C++ consists of a return type, function name, parameter list in parentheses, and a function body enclosed in curly brackets."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Consider the following C++ code: `int add(int a, int b) { return a + b; }`. What happens when the compiler encounters this function declaration?",
    "answer": "The function is declared and can be invoked. Its definition is hoisted to the top of its scope, but in C++ this is not exactly true as it is not a 'hoist' like in JS; instead, the compiler processes it as it encounters the function.",
    "explanation": "The function declaration is processed by the compiler, allowing it to be invoked later in the code. The function body is executed in the context of its own scope."
  },
  {
    "id": "q3",
    "type": "true_false",
    "difficulty": "L3",
    "question": "In C++, function declarations are subject to the same scope and linkage rules as variable declarations.",
    "answer": "True",
    "explanation": "In C++, function declarations, like variable declarations, are subject to scope and linkage rules. Functions can have internal linkage (static) or external linkage (default), affecting their visibility across translation units."
  }
]
```