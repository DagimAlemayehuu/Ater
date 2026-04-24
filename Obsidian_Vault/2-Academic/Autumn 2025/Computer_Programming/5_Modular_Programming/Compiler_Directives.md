---
title: Compiler Directives
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
A compiler directive is a `pragma` instruction that provides additional information to the compiler, allowing it to make informed decisions about the compilation process, and is typically used to control specific aspects of the compilation, such as optimization or code generation. Compiler directives are usually denoted by the `#pragma` directive, followed by a specific keyword or identifier, such as `#pragma once` or `#pragma pack`.

# 2. Mental Model
Imagine you're building a Lego castle, and you want to tell the person building it to use a specific type of Lego brick for a certain part. A compiler directive is like a special instruction that you give to the compiler, telling it how to build your program, such as "use this specific type of brick for this part" or "don't use any bricks that are too small". This helps the compiler make the program exactly how you want it.

# 3. Syntax Mechanics
* Compiler directives typically start with the `#pragma` keyword.
* They can be used to control optimization levels, such as `#pragma optimize`.
* They can be used to control code generation, such as `#pragma pack`.
* They can be used to provide additional information about the code, such as `#pragma once`.

# 4. Memory Lifecycle
* Compiler directives do not affect the runtime memory allocation of a program.
* They are typically processed during the compilation phase and do not have any impact on the program's execution.
* Compiler directives can affect the size and layout of data structures, such as when using `#pragma pack`.
* Compiler directives can be used to control the inclusion of header files, such as when using `#pragma once`.

---

## 5. Worked Example

```cpp
#pragma once

#include <iostream>

class MyClass {
public:
    MyClass() {
        std::cout << "MyClass constructed" << std::endl;
    }

    ~MyClass() {
        std::cout << "MyClass destroyed" << std::endl;
    }
};

int main() {
    MyClass* obj = new MyClass();
    delete obj;
    return 0;
}
```

### Execution Walkthrough
1. The compiler encounters the `#pragma once` directive and ensures that the contents of the file are only included once in the compilation process.
2. The `MyClass` constructor and destructor are defined and will be called when an instance of `MyClass` is created or destroyed.
3. In the `main` function, a pointer to `MyClass` is created using `new`, which allocates memory on the heap and calls the `MyClass` constructor.
4. The `delete` operator is used to deallocate the memory and call the `MyClass` destructor.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the purpose of the `#pragma once` directive in C++?

**Implementation Challenge**: Suppose you have a header file that contains a class definition, and you want to ensure that the class is only defined once in a program, even if the header file is included multiple times. How would you use a compiler directive to achieve this?

**Debug Challenge**: Find the memory leak/bug in the provided code block.

---

### Answer Key
- L1_SCENARIO: The `#pragma once` directive ensures that the contents of a file are only included once in the compilation process.
- L2_IMPLEMENTATION: You would use the `#pragma once` directive at the beginning of the header file to ensure that the class is only defined once.
- L3_DEBUG: There is no memory leak in the provided code block, as the `delete` operator is used to deallocate the memory allocated by `new`. However, in a real-world scenario, it's recommended to use smart pointers or containers to manage memory instead of manual memory management with `new` and `delete`.