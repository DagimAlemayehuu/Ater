---
title: Storage Classes
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 28
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
Storage classes in C++ determine the scope, linkage, and lifetime of variables. The main storage classes are automatic, external, static, register, and mutable. Each has its own use cases and benefits.

## 2. Technical Deep-Dive
In C++, storage classes play a crucial role in determining the lifetime, scope, and linkage of variables. Understanding these concepts is essential for effective programming.

### Automatic Storage Class
The automatic storage class is the default storage class for local variables. Variables declared within a block or function are automatic. They are created when the block is entered and destroyed when the block is exited. For example:

```cpp
void myFunction() {
    int x = 10; // Automatic variable
}
```

### External Storage Class
The `extern` storage class is used to declare a global variable that can be accessed from any file in the program. It provides linkage to a variable. For example:

```cpp
// File1.cpp
int globalVar = 10;

// File2.cpp
extern int globalVar;
std::cout << globalVar << std::endl;
```

### Static Storage Class
The `static` storage class is used to retain the value of a variable between function calls. Static variables are initialized only once and have a scope limited to the block in which they are defined. For example:

```cpp
void myFunction() {
    static int count = 0;
    count++;
    std::cout << count << std::endl;
}
```

### Register Storage Class
The `register` storage class is a hint to the compiler to store the variable in a register. It is typically used for variables that are accessed frequently. For example:

```cpp
void myFunction() {
    register int regVar = 5;
    std::cout << regVar << std::endl;
}
```

### Mutable Storage Class
The `mutable` storage class specifier is used within a class to allow a data member to be modified even if it is part of an object declared as `const`. For example:

```cpp
class MutableExample {
public:
    mutable int data;
    MutableExample(int value) : data(value) {}
};

const MutableExample me(10);
me.data = 20; // Allowed because data is mutable
```


## 3. Step-by-Step Visualization
### The Artifact

## Storage Classes in C++

In C++, a storage class specifier is used to modify the properties of a variable, such as its scope, linkage, and lifetime. The storage classes in C++ are:

### 1. Automatic (auto)
- Variables declared within a block or function are automatic.
- They are created when the block is entered and destroyed when the block is exited.
- By default, variables without any storage class specifier are automatic.

### 2. External (extern)
- The `extern` storage class is used to declare a global variable that can be accessed from any file in the program.
- It is used to provide linkage to a variable.

### 3. Static (static)
- The `static` storage class is used to retain the value of a variable between function calls.
- Static variables are initialized only once.
- They have a scope limited to the block in which they are defined.

### 4. Register (register)
- The `register` storage class is a hint to the compiler to store the variable in a register.
- It is typically used for variables that are accessed frequently.

### 5. Mutable (mutable)
- The `mutable` storage class specifier is used within a class to allow a data member to be modified even if it is part of an object declared as `const`.

## Example Use Cases

```cpp
#include <iostream>

int main() {
    // Automatic variable
    int x = 10;
    {
        int y = 20; // Automatic variable
    }

    // External variable
    extern int globalVar;
    std::cout << globalVar << std::endl;

    // Static variable
    static int count = 0;
    count++;
    std::cout << count << std::endl;

    // Register variable
    register int regVar = 5;
    std::cout << regVar << std::endl;

    // Mutable variable
    class MutableExample {
    public:
        mutable int data;
        MutableExample(int value) : data(value) {}
    };
    const MutableExample me(10);
    me.data = 20; // Allowed because data is mutable
    std::cout << me.data << std::endl;

    return 0;
}
```


### Logic Walkthrough / Execution Trace
1. Automatic variables are created when a block is entered and destroyed when the block is exited.
2. External variables are global and can be accessed from any file.
3. Static variables retain their value between function calls.
4. Register variables are stored in registers for faster access.
5. Mutable variables can be modified even if they are part of a const object.

## 4. The Trap (Edge Case Analysis)
A common pitfall is misunderstanding the scope and lifetime of variables, especially when using static and external storage classes. Ensure that variables are properly initialized and accessed according to their storage class.