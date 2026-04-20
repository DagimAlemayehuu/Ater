---
title: Modules in C++
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 3
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
Imagine a library where books are organized into categories. In C++, a module is like a category that holds related code and data. Just as you can borrow a book from a library, you can import a module into your program and use its code and data.

## 2. Technical Deep-Dive
In C++, a module is a way to organize code into reusable units. Modules are defined using the `module` keyword followed by the name of the module. The module can then be imported into other parts of the program using the `import` statement. Modules provide a way to encapsulate code and data, making it easier to manage complexity and avoid naming conflicts. They also enable better code reuse and facilitate the creation of large-scale programs. A module can contain functions, variables, classes, and other definitions, and can be used to implement a wide range of programming concepts, such as libraries, frameworks, and applications. Modules are particularly useful in large programs, where they can help to reduce compilation times and improve code maintainability. For example, a module can be used to implement a mathematical library, providing functions for performing calculations and manipulating mathematical objects. The module can then be imported into other parts of the program, allowing the functions and variables to be used as needed. In addition to providing a way to organize code, modules also provide a way to control access to code and data. By using the `export` keyword, module authors can specify which definitions are visible to users of the module, and which are not. This helps to prevent naming conflicts and makes it easier to modify and maintain large programs.

## 3. Step-by-Step Visualization
### The Artifact

```cpp
// module example
module mymodule;

import mymodule;

void greet() {
    std::cout << "Hello, World!" << std::endl;
}
```


### Logic Walkthrough / Execution Trace
```cpp
// mymodule.cpp
module mymodule;

void greet() {
    std::cout << "Hello, World!" << std::endl;
}

// main.cpp
import mymodule;

int main() {
    greet();
    return 0;
}
```


## 4. The Trap (Edge Case Analysis)
One common pitfall when using modules in C++ is forgetting to export definitions. If a definition is not exported, it will not be visible to users of the module, leading to errors and unexpected behavior. To avoid this trap, module authors should carefully consider which definitions to export, and use the `export` keyword to make them visible.

---

## 5. Question

**Scenario-Based Question**: What happens if you try to use a function from a module without importing it?

**Implementation Challenge**: Write a C++ module named 'math' that exports a function 'add' taking two integers and returning their sum. Then, import and use this function in a main program.

**Socratic Debugger**:

Fix the bug in the following code block:
```
module mymath;
export void add(int a, int b);

void add(int a, int b) {
    std::cout << a + b << std::endl;
}

// main program
import mymath;

int main() {
    add(2, 3);
    return 0;
}
```
The bug is related to the visibility of the 'add' function.