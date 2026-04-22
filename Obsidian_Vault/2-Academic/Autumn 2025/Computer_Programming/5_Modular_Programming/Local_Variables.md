---
title: Local Variables
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 19
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Function Agreement]]"
---

# 1. Technical Definition
Local variables are variables declared within a `block scope`, which is a set of statements enclosed by curly brackets `{}`. The `scope` of a local variable is limited to the block in which it is declared, meaning it is only accessible within that specific block.

# 2. Mental Model
Imagine you have a toy box where you keep your toys. A local variable is like a toy that you keep in a small box inside your room. Just like how you can't play with the toy outside of your room, a local variable can only be used within the specific part of the program where it was created.

# 3. Syntax Mechanics
* Local variables are declared using the `var`, `let`, or `const` keywords.
* They are defined within a block scope, which is typically enclosed by curly brackets `{}`.
* Local variables can be used only within the block where they are declared.
* They are created and destroyed as the program executes the block.

# 4. Memory Lifecycle
* Local variables are created when the program enters the block where they are declared.
* They are destroyed when the program exits the block.
* Each time the block is executed, a new instance of the local variable is created.
* The number of local variables is limited by the maximum recursion depth and the size of the call stack.

---

## 5. Worked Example

```cpp
#include <iostream>

void myFunction() {
    int localVar = 10; // localVar is a local variable
    std::cout << "Inside myFunction: " << localVar << std::endl;
}

int main() {
    myFunction();
    // std::cout << localVar << std::endl; // This would cause a compilation error
    return 0;
}
```

### Execution Walkthrough
1. The program starts executing the `main` function.
2. The `main` function calls `myFunction()`.
3. Inside `myFunction()`, a local variable `localVar` is created and initialized to 10.
4. The value of `localVar` is printed to the console.
5. `myFunction()` returns, and `localVar` is destroyed.
6. The program continues executing in `main()`, but it cannot access `localVar` because it is out of scope.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the scope of a local variable in C++?

**Implementation Challenge**: Write a C++ function that demonstrates the use of a local variable to store and print a value.

**Debug Challenge**: Find the bug in the following code and explain why it occurs: 
```cpp
#include <iostream>

int* createLocalVar() {
    int localVar = 20;
    return &localVar;
}

int main() {
    int* ptr = createLocalVar();
    std::cout << *ptr << std::endl;
    return 0;
}
```

---

### Answer Key
* L1_SCENARIO: The scope of a local variable in C++ is limited to the block in which it is declared.
* L2_IMPLEMENTATION: A C++ function that demonstrates the use of a local variable:
```cpp
void printLocalVar() {
    int localVar = 30;
    std::cout << "Local variable: " << localVar << std::endl;
}
```
* L3_DEBUG: The bug in the code is that it attempts to access a local variable after it has been destroyed. The `createLocalVar` function returns a pointer to `localVar`, but `localVar` is destroyed when the function returns. This results in undefined behavior when trying to print the value pointed to by `ptr`. The fix is to dynamically allocate memory for the variable using `new` and `delete`. 
```cpp
int* createLocalVar() {
    int* ptr = new int(20);
    return ptr;
}

int main() {
    int* ptr = createLocalVar();
    std::cout << *ptr << std::endl;
    delete ptr;
    return 0;
}
```