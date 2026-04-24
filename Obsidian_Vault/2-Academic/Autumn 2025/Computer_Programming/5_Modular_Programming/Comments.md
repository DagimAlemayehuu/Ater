# 1. Technical Definition
In C++, a `comment` is a section of code that is ignored by the compiler and is used to add notes or explanations to the source code. Comments are denoted by `//` for single-line comments and `/* */` for multi-line comments.

# 2. Mental Model
Imagine you're writing a story and you want to leave a note to yourself or someone else reading the story about why you made a certain decision. A comment is like a sticky note that you can attach to a line of code to explain what it does or why you wrote it that way.

# 3. Syntax Mechanics
* Single-line comments start with `//` and continue until the end of the line.
* Multi-line comments start with `/*` and end with `*/`, and can span multiple lines.
* Comments can be used to explain variables, functions, and logic in the code.
* Comments are ignored by the compiler and do not affect the execution of the program.

# 4. Memory Lifecycle
* Comments do not take up memory in the compiled program.
* Comments are only used by developers to understand the code and are discarded during compilation.
* There is no limit to the number of comments that can be used in a program.
* Comments can be used to temporarily disable code, but this is generally considered bad practice.

generated: true
---

## 5. Worked Example

```cpp
#include <iostream>

/* This is a multi-line comment
   that explains the purpose of the program */
// The program simply prints "Hello, World!" to the console

int main() {
  // Print "Hello, World!" to the console
  std::cout << "Hello, World!" << std::endl;
  return 0;
}
```

### Execution Walkthrough
1. The preprocessor includes the iostream header file, which allows for input/output operations.
2. The compiler encounters the multi-line comment and ignores it.
3. The compiler encounters the single-line comment and ignores it.
4. The compiler compiles the main function, which prints "Hello, World!" to the console.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the purpose of a comment in C++?

**Implementation Challenge**: Write a C++ program that uses both single-line and multi-line comments to explain its functionality.

**Debug Challenge**: Find the memory leak/bug in the provided code block (there is no memory leak, but identify why comments are not a bug).

---

### Answer Key
* L1_SCENARIO: A comment in C++ is used to add notes or explanations to the source code and is ignored by the compiler.
* L2_IMPLEMENTATION: A simple C++ program with comments, like the provided artifact, demonstrates the use of comments.
* L3_DEBUG: There is no memory leak or bug in the provided code block; comments are simply ignored by the compiler and do not affect the execution of the program.