---
title: Tokens
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
---

# 1. Technical Definition
A `token` is a discrete, atomic unit of a `string` that can be processed individually, often used in lexical analysis and parsing. In computing, a token is a sequence of characters that can be treated as a single unit, such as a `keyword`, `identifier`, `literal`, or `symbol`.

# 2. Mental Model
Imagine you're playing with building blocks, and each block represents a small piece of information. A token is like one of these blocks - it's a single piece that can be used to build something bigger, like a sentence or a program.

# 3. Syntax Mechanics
* Tokens can be classified into different types, such as keywords, identifiers, literals, and symbols.
* Tokens are often separated by whitespace or special characters.
* Tokens can be used to construct more complex structures, such as expressions and statements.
* Tokens can have specific meanings or values, depending on the context in which they are used.

# 4. Memory Lifecycle
* Tokens have a limited scope and lifetime, often being created and discarded during the parsing process.
* Tokens can be stored in memory for a short period, but are typically not retained long-term.
* The number of tokens that can be processed is limited by the available memory and computational resources.
* Tokens can be garbage collected or deleted when they are no longer needed.

---

## 5. Worked Example

```cpp
#include <iostream>
#include <vector>
#include <string>

// Enum for token types
enum class TokenType {
    KEYWORD,
    IDENTIFIER,
    LITERAL,
    SYMBOL
};

// Token class
class Token {
public:
    TokenType type;
    std::string value;

    Token(TokenType type, std::string value) : type(type), value(value) {}
};

// Function to tokenize a string
std::vector<Token> tokenize(const std::string& input) {
    std::vector<Token> tokens;
    std::string currentToken;

    for (char c : input) {
        if (isspace(c)) {
            if (!currentToken.empty()) {
                // Assume it's an identifier for simplicity
                tokens.push_back(Token(TokenType::IDENTIFIER, currentToken));
                currentToken.clear();
            }
        } else {
            currentToken += c;
        }
    }

    if (!currentToken.empty()) {
        // Assume it's an identifier for simplicity
        tokens.push_back(Token(TokenType::IDENTIFIER, currentToken));
    }

    return tokens;
}

int main() {
    std::string input = "hello world";
    std::vector<Token> tokens = tokenize(input);

    for (const Token& token : tokens) {
        std::cout << "Token Type: " << static_cast<int>(token.type) << ", Value: " << token.value << std::endl;
    }

    return 0;
}
```

### Execution Walkthrough
1. The program starts by including necessary headers and defining an enum for token types.
2. A `Token` class is defined to represent individual tokens, with a type and a value.
3. The `tokenize` function takes a string input and splits it into tokens based on whitespace.
4. In the `main` function, a sample string "hello world" is tokenized and the resulting tokens are printed.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary function of the `tokenize` function in the provided C++ code?

**Implementation Challenge**: Suppose you need to add support for keywords in the tokenizer. How would you modify the `tokenize` function and the `Token` class to achieve this?

**Debug Challenge**: Identify a potential memory leak in the provided code and propose a solution to fix it.

---

### Answer Key
- **L1_SCENARIO:** The primary function of the `tokenize` function is to split a given string into individual tokens based on whitespace.
- **L2_IMPLEMENTATION:** To add support for keywords, you could modify the `Token` class to include a `bool` flag indicating whether the token is a keyword. The `tokenize` function would then check if the token matches any known keywords and set the flag accordingly. You might also want to add a `std::unordered_map<std::string, TokenType>` to map keywords to their respective token types.
- **L3_DEBUG:** A potential memory leak could occur if the `Token` class dynamically allocates memory (e.g., using `new`) but fails to release it. Since the `Token` class in the provided code does not dynamically allocate memory, there isn't an immediate memory leak. However, if you were to modify the class to use dynamic memory allocation, ensure you use smart pointers (like `std::unique_ptr` or `std::shared_ptr`) to manage the memory and avoid leaks.