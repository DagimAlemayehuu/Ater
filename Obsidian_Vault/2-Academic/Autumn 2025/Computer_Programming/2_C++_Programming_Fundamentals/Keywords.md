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
Imagine you're playing a game where certain words are like magic commands that the game understands in a special way. These words, called keywords, tell the game (or in this case, the compiler) to do specific things that can't be changed, like "if" to make a decision or "while" to repeat an action. Just like how the game has its own set of magic commands, a programming language has its own set of keywords that the compiler understands in a special way.

# 2. Execution Logic & Data Flow
Keywords are integral to the syntax and semantics of a programming language, dictating how the compiler interprets the code. When the compiler encounters a keyword, it triggers a specific [[Parsing]] action, altering the [[Abstract_Syntax_Tree]] (AST) construction. For instance, the `if` keyword in C++ initiates a conditional [[Control_Flow]] mechanism, prompting the compiler to expect a condition and a subsequent block of code. The compiler's [[Lexical_Analysis]] phase identifies keywords, distinguishing them from identifiers and literals. This process ensures that the compiler adheres to the language's syntax and semantics.

# 3. Edge Cases & Failure States
The misuse of keywords can lead to [[Syntax_Errors]], which the compiler must detect and report. For example, attempting to use a keyword as a variable name in C++ will result in a compilation error. The compiler must also handle cases where a keyword is used in a context where it's not applicable, such as using `return` in a [[Global_Scope]]. Furthermore, the compiler's [[Semantic_Analysis]] phase must ensure that keywords are used in accordance with their predefined meanings, preventing incorrect [[Type_Checking]] and [[Scope_Resolution]]. Failure to properly handle keywords can compromise the compiler's ability to generate correct machine code.
# 4. Implementation Mechanics
```cpp
#include <iostream>
#include <string>
#include <unordered_map>

// Define a simple lexer that identifies keywords
class Lexer {
public:
    Lexer(const std::string& code) : code_(code) {}

    // Simplified lexical analysis
    void analyze() {
        std::unordered_map<std::string, bool> keywords = {
            {"if", true}, {"else", true}, {"while", true}, {"return", true}
        };

        size_t pos = 0;
        while (pos < code_.size()) {
            if (isspace(code_[pos])) {
                pos++;
                continue;
            }

            size_t start = pos;
            while (pos < code_.size() && !isspace(code_[pos])) {
                pos++;
            }

            std::string token = code_.substr(start, pos - start);
            if (keywords.find(token) != keywords.end()) {
                std::cout << token << " is a keyword." << std::endl;
            } else {
                std::cout << token << " is not a keyword." << std::endl;
            }
        }
    }

private:
    std::string code_;
};

int main() {
    std::string code = "if (x > 5) return x; else while (y < 10) y++;";
    Lexer lexer(code);
    lexer.analyze();
    return 0;
}
```
This C++ code demonstrates a basic lexer that identifies keywords in a given piece of code. It uses an unordered map to store known keywords and then scans the input code to match tokens against this list.

To read this code block: The provided C++ code defines a simple lexer class that performs lexical analysis on a given string of code. It checks each token against a list of predefined keywords and outputs whether each token is a keyword or not.

## 5. Walkthrough
Here's a step-by-step walkthrough of how the lexer works with the provided code:

1. **Initialization**: The lexer is initialized with a string of code: `if (x > 5) return x; else while (y < 10) y++;`.
2. **Lexical Analysis**: The `analyze` method starts scanning the code from left to right. It skips whitespace characters and identifies tokens by finding sequences of non-whitespace characters.
3. **Token Identification**: The first token identified is `if`. The lexer checks if `if` is in the list of keywords and finds that it is. It outputs: `if is a keyword.`.
4. **Continued Analysis**: The lexer continues scanning and identifies the tokens `(`, `x`, `>`, `5`, `)`, `return`, `x`, `;`, `else`, `while`, `(`, `y`, `<`, `10`, `)`, `y`, `++`.
5. **Keyword Check for Each Token**: For each token, the lexer checks if it's a keyword. It outputs:
   - `if is a keyword.`
   - `else is a keyword.`
   - `while is a keyword.`
   - `return is a keyword.`
   For tokens that are not keywords (like `x`, `y`, `(`, `)`, etc.), it outputs that they are not keywords.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "Keywords in programming languages are used to [[Blank1]] specific actions or control structures.",
    "textWithBlanks": "Keywords in programming languages are used to [[Blank1]] specific actions or control structures.",
    "answer": [
      "define"
    ],
    "explanation": "Keywords are used to define specific actions or control structures in programming languages."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "Using a keyword as a variable name in C++ will result in a compilation warning.",
    "answer": "False",
    "explanation": "Using a keyword as a variable name in C++ will result in a compilation error, not a warning."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the given code snippet that attempts to use a keyword as a variable name.",
    "content": "int if = 5;",
    "answer": "The bug is using the keyword 'if' as a variable name. It should be changed to a valid identifier.",
    "explanation": "The code attempts to declare an integer variable named 'if', which is a keyword in C++. This will cause a compilation error."
  }
]
```