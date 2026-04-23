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
- "[[Identifier Scope]]"
---

# 1. Technical Definition
Local variables are declared within a specific block or function and have a scope that is limited to that block or function, meaning they are only accessible within that region of the code. The `scope` of a local variable is defined by the `{}` block in which it is declared, and it ceases to exist once the block is exited.

# 2. Mental Model
Imagine you have a toy box where you keep your toys, and this toy box is only accessible within a specific room in your house. Just like how the toys in the box are only available for play within that room, local variables are like those toys, and they can only be used within the specific part of the code where they are defined.

# 3. Syntax Mechanics
* Local variables are declared using keywords like `let`, `const`, or `var` within a block or function.
* They are only accessible within the block or function where they are declared.
* Local variables can shadow global variables with the same name.
* They are created and destroyed as the block or function is executed and exited.

# 4. Memory Lifecycle
* Local variables are created when the block or function is executed and are stored in memory.
* They are destroyed and removed from memory when the block or function is exited.
* Each time the block or function is executed, new local variables are created, and old ones are destroyed.
* The number of local variables is limited by the maximum call stack size and the memory available to the program.

---

## 5. Worked Example

```cpp
#include <iostream>

void myFunction() {
    int localVar = 10; // local variable
    std::cout << "Inside myFunction(): " << localVar << std::endl;
}

int main() {
    myFunction();
    // std::cout << localVar << std::endl; // This would cause a compilation error
    return 0;
}
```

### Execution Walkthrough
1. The program starts executing the `main()` function.
2. `main()` calls `myFunction()`, which declares a local variable `localVar` and initializes it to 10.
3. `myFunction()` prints the value of `localVar` to the console.
4. `myFunction()` ends, and `localVar` goes out of scope and is destroyed.
5. The program returns to `main()` and continues executing, but it cannot access `localVar` because it is out of scope.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the scope of a local variable declared within a function in C++?

**Implementation Challenge**: Suppose you want to write a C++ function that calculates the area and perimeter of a rectangle. How would you declare and use local variables for the length and width within that function?

**Debug Challenge**: In the provided code block, what would happen if you tried to access `localVar` from `main()` after `myFunction()` has returned, and how would you fix a code that attempts to do so?

---

### Answer Key
- L1_SCENARIO: The scope of a local variable declared within a function in C++ is limited to that function only.
- L2_IMPLEMENTATION: You would declare local variables for length and width within the function, use them to calculate area and perimeter, and then return these values. For example:
```cpp
void calculateRectangleProperties(int length, int width) {
    int area = length * width;
    int perimeter = 2 * (length + width);
    std::cout << "Area: " << area << ", Perimeter: " << perimeter << std::endl;
}
```
- L3_DEBUG: If you tried to access `localVar` from `main()` after `myFunction()` has returned, the code would not compile because `localVar` is out of scope. To fix a code that attempts to do so, you would need to redesign it so that the variable's scope includes `main()`, for example, by declaring it as a global variable or by returning its value from `myFunction()` and assigning it to a variable in `main()`. For example:
```cpp
int myFunction() {
    int localVar = 10;
    return localVar;
}

int main() {
    int result = myFunction();
    std::cout << "Result: " << result << std::endl;
    return 0;
}
```