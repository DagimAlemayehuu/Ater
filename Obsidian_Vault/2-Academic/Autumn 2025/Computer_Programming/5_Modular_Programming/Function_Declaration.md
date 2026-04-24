---
title: Function_Declaration
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 4
mode: CS-SOFTWARE
read: false
generated: true
prerequisites:
- "[[Function]]"
---

# 1. Mental Model
Imagine you're ordering food at a restaurant. You need to tell the waiter what you want before they can bring it to you. A function declaration is like telling the waiter what food you can order and how to prepare it. You're defining what the function does and what it's called, so others (or your own code later on) can use it.

# 2. Execution Logic & Data Flow
When a function is declared, it's added to the [[Symbol_Table]] with its name and [[Function_Signature]], which includes the return type and parameters. The [[Compiler]] or [[Interpreter]] then checks the function declaration during the [[Parse_Tree]] construction phase, ensuring that the function can be called later with the correct [[Call_Stack]] and [[Argument_List]]. When the function is called, the [[Stack_Frame]] is created, and control is transferred to the function's body.

# 3. Edge Cases & Failure States
If a function is called before it's declared, the [[Compiler]] or [[Interpreter]] may throw a [[Syntax_Error]] or [[Reference_Error]], depending on the language. For example, in languages with [[Hoisting]], function declarations are moved to the top of their scope, but this doesn't apply to [[Function_Expressions]]. Additionally, [[Overloading]] and [[Overriding]] can lead to issues if not handled correctly, resulting in [[Ambiguous_Reference]] or [[Incompatible_Types]] errors.
# 4. Implementation Mechanics
```javascript
// Annotated AST Snippet
FunctionDeclaration {
  name: "add",
  params: [
    { name: "a", type: "number" },
    { name: "b", type: "number" }
  ],
  returnType: "number",
  body: {
    type: "BlockStatement",
    statements: [
      {
        type: "ReturnStatement",
        expression: {
          type: "BinaryExpression",
          operator: "+",
          left: { name: "a", type: "number" },
          right: { name: "b", type: "number" }
        }
      }
    ]
  }
}
```
This AST snippet represents a function declaration for `add` that takes two parameters, `a` and `b`, both of type `number`, and returns their sum. The function body contains a single return statement with a binary expression.

To read this: The annotated AST snippet shows the structure of a function declaration, including its name, parameters, return type, and body. The body contains a block statement with a return statement that includes a binary expression.

## 5. Walkthrough
Here's a step-by-step walkthrough of how the function declaration `add` works:

1. The function declaration `add` is encountered during the parse tree construction phase.
2. The compiler or interpreter adds the function declaration to the symbol table with its name and function signature.
3. When the function `add` is called with arguments `2` and `3`, a new stack frame is created.
4. The control is transferred to the function's body, which contains a return statement with a binary expression.
5. The binary expression is evaluated, and the result is returned as the output of the function.

For example, given the function call `add(2, 3)`, the intermediate calculations would be:

* `a = 2`
* `b = 3`
* `result = a + b = 2 + 3 = 5`

The final output of the function would be `5`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "A function declaration is added to the [[Symbol_Table]] with its name and [[Function_Signature]], which includes the ______ and parameters.",
    "textWithBlanks": "A function declaration is added to the [[Symbol_Table]] with its name and [[Function_Signature]], which includes the [[Return_Type]] and [[Parameters]].",
    "answer": [
      "return type"
    ],
    "explanation": "The function signature includes the return type and parameters."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "In languages with hoisting, function expressions are moved to the top of their scope.",
    "answer": "False",
    "explanation": "Only function declarations are moved to the top of their scope in languages with hoisting, not function expressions."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code.",
    "content": "function add(a, b) { return a + c; }",
    "answer": "The bug is that the variable 'c' is not defined. The correct code should be 'function add(a, b) { return a + b; }'",
    "explanation": "The variable 'c' is not defined in the function's scope, causing a reference error."
  }
]
```