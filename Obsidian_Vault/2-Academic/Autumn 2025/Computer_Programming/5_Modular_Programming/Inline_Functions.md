---
title: Inline Functions
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
---

# 1. Technical Definition
An `inline function` is a function that is expanded in-line by the compiler, replacing the function call with the actual function body, thereby eliminating the overhead of a function call. The `inline` keyword is used to declare a function as an inline function, suggesting to the compiler that it should inline the function.

# 2. Syntax Mechanics
* The `inline` keyword is used to declare a function as an inline function, typically in the function prototype, e.g., `inline int add(int a, int b)`.
* The compiler may choose to inline the function even if the `inline` keyword is not used, a process known as `implicit inlining`.
* Inline functions can be defined in header files, but must be marked as `inline` to avoid multiple definition errors.
* The `inline` keyword can also be used in conjunction with other storage class specifiers, such as `static` or `extern`.

# 3. Memory Lifecycle
* Inline functions do not have a separate memory allocation for the function body, as the code is expanded in-line at the call site.
* The compiler must ensure that the inline function is not defined multiple times, which can lead to `multiple definition` errors.
* Inline functions can increase code size if the function body is large, potentially leading to performance degradation due to increased instruction cache misses.
* The linker may choose to discard inline functions if they are not referenced, a process known as `dead code elimination`.

---

## 4. Worked Example

```cpp
// Example of an inline function in C++
inline int add(int a, int b) {
    return a + b;
}

int main() {
    int result = add(5, 10);
    return 0;
}
```

---

## 5. Knowledge Check

```interactive-quiz
[
  {
    "id": "q1",
    "type": "writing",
    "difficulty": "L1",
    "question": "What is the purpose of the `inline` keyword in C++?",
    "answer": "The `inline` keyword is used to declare a function as an inline function, suggesting to the compiler that it should inline the function, thereby eliminating the overhead of a function call.",
    "explanation": "The `inline` keyword is used to declare a function as an inline function, which allows the compiler to replace the function call with the actual function body."
  },
  {
    "id": "q2",
    "type": "code",
    "difficulty": "L2",
    "question": "What is the output of the following code snippet?",
    "codeSnippet": "inline int add(int a, int b) { return a + b; } int main() { int result = add(5, 10); return result; }",
    "answer": "15",
    "explanation": "The `add` function is inlined, and the expression `5 + 10` is evaluated, resulting in `15`."
  },
  {
    "id": "q3",
    "type": "fill_in",
    "difficulty": "L3",
    "question": "What are the potential drawbacks of using inline functions?",
    "textWithBlanks": "Inline functions can increase [[Blank1]] if the function body is large, potentially leading to performance degradation due to increased [[Blank2]].",
    "answer": ["code size", "instruction cache misses"],
    "explanation": "Inline functions can increase code size if the function body is large, potentially leading to performance degradation due to increased instruction cache misses."
  }
]
```