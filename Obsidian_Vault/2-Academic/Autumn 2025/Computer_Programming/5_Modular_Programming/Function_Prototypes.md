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
A function prototype is a declaration of a function that specifies its name, return type, and parameter list, but does not include the function body. The `function prototype` provides a way to inform the compiler about the existence of a function, its `signature`, and its `calling convention`.

# 2. Mental Model
Imagine you're telling your friend about a recipe you want to share, but you haven't written it down yet. You tell them the name of the dish, what ingredients you'll need (like flour, sugar, and eggs), and what you'll end up with (like a cake). This is like a function prototype - it tells the compiler what the function is called, what it needs to work (parameters), and what it will give back (return type).

# 3. Syntax Mechanics
* A function prototype typically includes the `return type`, `function name`, and `parameter list` in parentheses.
* The parameter list includes the `parameter types` and `parameter names`, but the names are optional.
* Function prototypes are usually placed at the top of a source file or in a header file to be included by other source files.
* A function prototype can be used to declare a function before it is defined.

# 4. Memory Lifecycle
* Function prototypes do not allocate memory for the function itself; they only provide a declaration.
* There is no memory limit for the number of function prototypes that can be declared.
* Function prototypes are typically discarded by the compiler after they are used to check function calls.
* A function prototype does not have a runtime presence; it only affects the compilation process.

---

## 5. Worked Example

```cpp
#include <iostream>

// Function prototype
int addNumbers(int a, int b);

int main() {
    int result = addNumbers(5, 10);
    std::cout << "The result is: " << result << std::endl;
    return 0;
}

// Function definition
int addNumbers(int a, int b) {
    return a + b;
}
```

### Execution Walkthrough
1. The compiler encounters the function prototype `int addNumbers(int a, int b);`, which informs it about the existence of a function named `addNumbers` that takes two `int` parameters and returns an `int`.
2. In the `main` function, the compiler checks the function call `addNumbers(5, 10)` against the function prototype to ensure it matches.
3. The function `addNumbers` is defined after `main`, but because of the function prototype, the compiler knows its signature and can correctly link the call in `main` to the definition of `addNumbers`.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary purpose of a function prototype in C++?

**Implementation Challenge**: Suppose you are developing a library with a function `double calculateArea(double radius)` that calculates the area of a circle. How would you use a function prototype to declare this function for use in other parts of your program?

**Debug Challenge**: Consider the following code with a function prototype and definition. Identify a potential issue if the function prototype and definition do not match: 
```cpp
// Function prototype
void printMessage(int message);

// Function definition
void printMessage(std::string message) {
    std::cout << message << std::endl;
}

int main() {
    printMessage(10);
    return 0;
}
```

---

### Answer Key
- **L1_SCENARIO:** The primary purpose of a function prototype in C++ is to declare a function's name, return type, and parameter list to the compiler before the function is defined or used.
- **L2_IMPLEMENTATION:** You would declare the function prototype at the top of your library's header file like this: `double calculateArea(double radius);`. This informs other parts of the program about the existence and signature of `calculateArea` without needing the full function definition.
- **L3_DEBUG:** A potential issue is a mismatch between the function prototype `void printMessage(int message);` and its definition `void printMessage(std::string message)`. When `printMessage(10)` is called in `main`, it will attempt to pass an `int` to a function expecting a `std::string`, leading to a compilation error due to the type mismatch. The correct approach would be to ensure the prototype and definition match, or to provide an overload for `int` if needed.