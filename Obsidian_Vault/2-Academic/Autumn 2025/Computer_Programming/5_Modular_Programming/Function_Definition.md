---
title: Function Definition
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 6
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Function Prototypes]]"
---

# 1. Technical Definition
A function definition in programming is a block of code that is defined once and can be called multiple times from different parts of a program, with a specific set of inputs known as `parameters` or `arguments`. The general syntax for a function definition is `function_name (parameter1, parameter2, ...) { // function body }`, where the function body contains the code that is executed when the function is called.

# 2. Mental Model
Imagine you have a recipe for making a sandwich. A function is like a recipe: you write it down once, and then you can follow it many times to make many sandwiches. Just like how a recipe takes ingredients (like bread and cheese) as inputs, a function takes values (like numbers or text) as inputs, and it produces a result (like a made sandwich).

# 3. Syntax Mechanics
* A function definition starts with the `function` keyword followed by the function name and a list of parameters in parentheses.
* The function body is enclosed in curly brackets `{}` and contains the code that is executed when the function is called.
* Parameters are placeholders for values that are passed to the function when it is called.
* A function can return a value using the `return` statement.

# 4. Memory Lifecycle
* A function definition is stored in memory only once, when the program is loaded.
* Each time a function is called, a new block of memory is allocated to store the function's local variables and parameters.
* The memory allocated for a function's local variables and parameters is released when the function returns.
* A function can only access its own local variables and parameters, as well as global variables that are defined outside the function.

---

## 5. Worked Example

```cpp
#include <iostream>
using namespace std;

int addNumbers(int a, int b) {
    int sum = a + b;
    return sum;
}

int main() {
    int result = addNumbers(5, 10);
    cout << "The sum is: " << result << endl;
    return 0;
}
```

### Execution Walkthrough
1. The program starts executing from the `main` function.
2. The `addNumbers` function is called with arguments `5` and `10`.
3. A new block of memory is allocated to store the local variables `a`, `b`, and `sum` for the `addNumbers` function.
4. The code inside the `addNumbers` function is executed, calculating the sum of `a` and `b` and storing it in `sum`.
5. The `addNumbers` function returns the value of `sum`, which is stored in the `result` variable in the `main` function.
6. The memory allocated for the `addNumbers` function's local variables is released.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary purpose of a function definition in programming?

**Implementation Challenge**: Suppose you want to write a program that calculates the area of a rectangle. How would you use a function to achieve this?

**Debug Challenge**: Find the memory leak/bug in the provided code block.

---

### Answer Key
* L1_SCENARIO: A function definition is a block of code that is defined once and can be called multiple times from different parts of a program.
* L2_IMPLEMENTATION: You would define a function `calculateArea` that takes two parameters, `length` and `width`, and returns their product. You can then call this function with different values for `length` and `width` to calculate the area of different rectangles.
* L3_DEBUG: There is no apparent memory leak in the provided code block. However, one potential bug is that the `addNumbers` function does not perform any error checking on its inputs. For example, if the inputs are very large, the result may overflow the range of an `int`. To fix this, you could add error checking code to handle such cases.