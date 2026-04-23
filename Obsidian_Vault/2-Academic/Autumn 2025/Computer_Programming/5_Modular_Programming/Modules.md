---
read: false
---

# 1. Technical Definition
A `module` is a separate unit of code that provides a specific functionality, and can be composed with other modules to form a larger program. In programming, a module is a file or a collection of files that contain a set of related `functions`, `classes`, and `variables`.

# 2. Mental Model
Imagine you have a bunch of LEGO boxes, each containing a specific set of LEGO pieces that can be used to build something. Just like how you can use individual LEGO pieces from different boxes to build a bigger structure, modules are like these LEGO boxes that contain reusable code pieces that can be combined to create a larger program.

# 3. Syntax Mechanics
* Modules can be imported and exported to share functionality between different parts of a program.
* A module can contain a set of related functions, classes, and variables that can be used by other parts of the program.
* Modules can be composed together to form a larger program, allowing for modular and reusable code.
* Modules can have dependencies on other modules, which must be resolved in order for the program to work correctly.

# 4. Memory Lifecycle
* Modules are loaded into memory when they are imported, and can be unloaded when they are no longer needed.
* Modules can have a limited scope, meaning that variables and functions defined within a module are not accessible from outside the module.
* Modules can have dependencies that must be resolved at runtime, which can affect the performance and behavior of the program.
* Modules can be cached or memoized to improve performance by reducing the need to reload or recompute their contents.

---

## 5. Worked Example

```cpp
// mymodule.h
#ifndef MYMODULE_H
#define MYMODULE_H

int add(int a, int b);

#endif

// mymodule.cpp
#include "mymodule.h"

int add(int a, int b) {
    return a + b;
}

// main.cpp
#include "mymodule.h"
#include <iostream>

int main() {
    int result = add(2, 3);
    std::cout << "Result: " << result << std::endl;
    return 0;
}
```

### Execution Walkthrough
1. The compiler compiles `mymodule.cpp` into an object file `mymodule.o`.
2. The linker links `mymodule.o` with `main.cpp` to create an executable `main`.
3. When `main` is run, it loads the code from `mymodule` into memory.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary purpose of a module in programming?

**Implementation Challenge**: Suppose you are building a large program that requires a calculator module. How would you design and implement this module to make it reusable in other parts of the program?

**Debug Challenge**: Find the memory leak/bug in the following code: 
```cpp
// buggy_module.h
#ifndef BUGGY_MODULE_H
#define BUGGY_MODULE_H

int* createArray(int size);

#endif

// buggy_module.cpp
#include "buggy_module.h"

int* createArray(int size) {
    int* arr = new int[size];
    // no delete statement
    return arr;
}

// buggy_main.cpp
#include "buggy_module.h"
#include <iostream>

int main() {
    int* arr = createArray(10);
    std::cout << "Array created" << std::endl;
    delete[] arr; // whoops, double delete?
    return 0;
}
```

---

### Answer Key
* L1_SCENARIO: A module provides a specific functionality and can be composed with other modules to form a larger program.
* L2_IMPLEMENTATION: A calculator module would contain related functions (e.g., `add`, `subtract`, `multiply`, `divide`) and would be designed to be imported and used by other parts of the program.
* L3_DEBUG: The bug is a memory leak due to the missing `delete` statement in `buggy_module.cpp`, and a potential double delete in `buggy_main.cpp`. The fix is to add a `delete[]` statement in `buggy_module.cpp` or use smart pointers. 
The corrected code would look something like this:
```cpp
// fixed_module.h
#ifndef FIXED_MODULE_H
#define FIXED_MODULE_H

int* createArray(int size);

#endif

// fixed_module.cpp
#include "fixed_module.h"

int* createArray(int size) {
    int* arr = new int[size];
    return arr;
}

// fixed_main.cpp
#include "fixed_module.h"
#include <iostream>

int main() {
    int* arr = createArray(10);
    std::cout << "Array created" << std::endl;
    delete[] arr;
    return 0;
}
```
Or using smart pointers:
```cpp
// fixed_module.h
#ifndef FIXED_MODULE_H
#define FIXED_MODULE_H

std::unique_ptr<int[]> createArray(int size);

#endif

// fixed_module.cpp
#include "fixed_module.h"

std::unique_ptr<int[]> createArray(int size) {
    return std::make_unique<int[]>(size);
}

// fixed_main.cpp
#include "fixed_module.h"
#include <iostream>

int main() {
    auto arr = createArray(10);
    std::cout << "Array created" << std::endl;
    return 0;
}
```