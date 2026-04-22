---
title: Function Prototypes
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 5
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Function Declaration]]"
---

# 1. Technical Definition
A function prototype is a declaration of a function that specifies the function's name, return type, and parameters, but does not provide the function's implementation. The `function prototype` is used to inform the compiler of the existence of a function, its `return_type`, and the number and types of its `formal parameters`.

# 2. Mental Model
Imagine you're telling your friend about a recipe you want to make, but you haven't started cooking yet. You tell them the name of the dish, what ingredients you'll use, and what you'll need to do to make it. This is like a function prototype - you're telling the compiler what the function will do, without actually doing it.

# 3. Syntax Mechanics
* A function prototype typically consists of the `return_type`, `function_name`, and `parameter_list` in parentheses.
* The `parameter_list` includes the type and name of each parameter, separated by commas.
* Function prototypes are usually placed at the top of a source file or in a header file.
* They end with a semicolon, indicating the end of the declaration.

# 4. Memory Lifecycle
* Function prototypes do not allocate memory for the function's implementation.
* They only inform the compiler of the function's existence and signature.
* Function prototypes are typically discarded after compilation.
* They do not have a runtime memory footprint.

---

## 5. Worked Example

```cpp
// Function prototype
int addNumbers(int a, int b);

// Main function
int main() {
    int result = addNumbers(5, 10);
    return 0;
}

// Function implementation
int addNumbers(int a, int b) {
    return a + b;
}
```

### Execution Walkthrough
1. The compiler encounters the function prototype `int addNumbers(int a, int b);` and notes the function's name, return type, and parameters.
2. The compiler then encounters the `main` function and sees the call to `addNumbers(5, 10)`.
3. Since the compiler has already seen the function prototype, it knows that `addNumbers` returns an `int` and takes two `int` parameters, so it can generate the correct code for the function call.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary purpose of a function prototype in C++?

**Implementation Challenge**: Suppose you are writing a C++ program that uses a function called `calculateArea` which takes two `double` parameters and returns a `double` value. Write a function prototype for `calculateArea`.

**Debug Challenge**: In the provided code block, what would happen if the function prototype for `addNumbers` was missing, and the function implementation was placed before the `main` function?

---

### Answer Key
* L1_SCENARIO: The primary purpose of a function prototype in C++ is to inform the compiler of the existence of a function, its return type, and the number and types of its formal parameters.
* L2_IMPLEMENTATION: A function prototype for `calculateArea` would be: `double calculateArea(double length, double width);`
* L3_DEBUG: If the function prototype for `addNumbers` was missing and the function implementation was placed before the `main` function, the code would still compile and run correctly because the compiler would have seen the function implementation before it was called in `main`. However, if the function implementation was placed after the `main` function, the code would not compile without a function prototype.