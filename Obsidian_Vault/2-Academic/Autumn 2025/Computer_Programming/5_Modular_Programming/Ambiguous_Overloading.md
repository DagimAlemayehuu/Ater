---
title: Ambiguous_Overloading
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 55
mode: CS-SOFTWARE
read: false
generated: true
prerequisites:
- "[[Function_Overloading]]"
---

# 1. Mental Model
Imagine you're at a restaurant with two identical-looking doors, one labeled "Burger" and the other "Tacos". When you try to enter, the host needs to know which door to send you to. If you just walk up and say "I'm hungry", the host will be confused because "I'm hungry" could mean you want a burger or a taco. This is similar to what happens in programming with ambiguous overloading, where the compiler can't decide which function to call because multiple functions have the same name but different parameters, and the input could match more than one.

# 2. Execution Logic & Data Flow
When a function call is made with ambiguous overloading, the [[Compiler]] attempts to resolve it by examining the [[Function_Signature]] of each overloaded function. The process involves [[Type_Conversion]] and [[Overload_Resolution]] rules to find the best match. In the case of `fun(5.5)`, the [[Literal]] `5.5` is a `double` by default, which can be implicitly converted to both `int` and `float`. However, since both conversions have similar ranks, the [[Compiler]] cannot determine a unique best match between `void fun(int a)` and `void fun(float a)`, leading to an ambiguity error.

# 3. Edge Cases & Failure States
Ambiguous overloading often arises with [[Literal]] values that can be interpreted in multiple ways, such as integer literals that can also be considered as floating-point numbers with a decimal part of zero. For instance, a call like `fun(5)` would not be ambiguous with the given overloads because `5` can be exactly represented as an `int`, but `fun(5.5)` is ambiguous because `5.5` is a `double` that can be converted to both `int` and `float` with equal [[Conversion_Rank]]. The [[Compiler]] will report an error in such cases, requiring the programmer to disambiguate the call, for example, by using a [[Cast]] like `fun((float)5.5)` or `fun((int)5.5)`.
# 4. Implementation Mechanics
```cpp
// C++ code snippet demonstrating ambiguous overloading
void fun(int a) {
    // Function implementation for int
}

void fun(float a) {
    // Function implementation for float
}

int main() {
    fun(5);   // Not ambiguous, calls fun(int)
    fun(5.5); // Ambiguous, could be either fun(int) or fun(float)
    return 0;
}
```
To read this code snippet: The provided C++ code defines two overloaded functions `fun(int a)` and `fun(float a)`. In the `main()` function, calling `fun(5)` is not ambiguous because `5` is an integer literal that directly matches `fun(int a)`. However, calling `fun(5.5)` results in ambiguity because the literal `5.5` is a `double` that can be implicitly converted to both `int` and `float`, making it unclear which function to call.

## 5. Walkthrough
Consider the following scenario to understand how ambiguous overloading is handled:

1. **Given Overloads**: Two functions are defined:
   - `void fun(int a)`
   - `void fun(float a)`

2. **Function Call**: The program attempts to call `fun(5.5)`.

3. **Literal Type**: The literal `5.5` is a `double` by default.

4. **Conversion Ranks**: 
   - Converting `double` to `int` involves a narrowing conversion (potential loss of precision), ranked as a specific conversion.
   - Converting `double` to `float` also involves a narrowing conversion but to a different type, similarly ranked.

5. **Ambiguity**: Since both conversions have similar ranks and there's no exact match, the compiler cannot determine a unique best match.

6. **Compiler Error**: The compiler reports an ambiguity error because it cannot resolve the function call uniquely.

7. **Resolution**: To fix the ambiguity, a cast can be used to disambiguate the call, such as `fun((float)5.5)` or `fun((int)5.5)`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "Ambiguous overloading occurs when the compiler cannot determine which function to call due to multiple functions with the same name but different parameters that could all potentially match the input, leading to a need for [[Blank1]] to resolve the call.",
    "textWithBlanks": "The compiler attempts to resolve function calls with ambiguous overloading by examining the [[Blank1]] of each overloaded function and applying [[Blank2]] and [[Blank3]] rules.",
    "answer": [
      "Function_Signature",
      "Type_Conversion",
      "Overload_Resolution"
    ]
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "A function call like fun(5) would be considered ambiguous with the given overloads (void fun(int a) and void fun(float a)).",
    "answer": "False",
    "explanation": "The call fun(5) is not ambiguous because 5 can be exactly represented as an int."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code snippet and propose a fix.",
    "content": "void fun(int a) { } void fun(float a) { } int main() { fun(5.5); return 0; }",
    "answer": "The bug is that the call to fun(5.5) is ambiguous. A fix is to use a cast, for example, fun((float)5.5) or fun((int)5.5).",
    "explanation": "The literal 5.5 is a double and can be converted to both int and float, leading to ambiguity. A cast disambiguates the call."
  }
]
```