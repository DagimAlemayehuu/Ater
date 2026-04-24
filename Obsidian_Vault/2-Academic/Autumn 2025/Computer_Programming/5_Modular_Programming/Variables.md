---
title: Variables
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
In programming, a `variable` is a named storage location that holds a value, which can be a `data type` such as an integer, string, or boolean. The value of a variable can be changed during the execution of a program, and it is referenced by its `identifier`.

# 2. Mental Model
Imagine you have a labeled box where you can store different toys. Just like how you can put a toy car in the box and then later take it out and put a toy doll in instead, a variable is like a labeled box where you can store different values, and you can change what's inside it later.

# 3. Syntax Mechanics
* Variables are declared with a `data type` and an `identifier`.
* The `identifier` is used to reference the variable in the code.
* Variables can be assigned a value using the assignment operator (=).
* The value of a variable can be updated or changed during program execution.

# 4. Memory Lifecycle
* Variables have a limited scope, which determines their accessibility in the code.
* Variables are stored in memory, and their values can be changed during program execution.
* Variables can have a default value or be initialized with a specific value.
* Variables can go out of scope, at which point they are no longer accessible and their memory is released.

---

## 5. Worked Example

```cpp
#include <iostream>
#include <string>

int main() {
    // Declare a variable with a data type and identifier
    int myInteger = 10;
    std::string myString = "Hello";

    // Print the initial values
    std::cout << "myInteger: " << myInteger << std::endl;
    std::cout << "myString: " << myString << std::endl;

    // Update the values of the variables
    myInteger = 20;
    myString = "World";

    // Print the updated values
    std::cout << "myInteger: " << myInteger << std::endl;
    std::cout << "myString: " << myString << std::endl;

    return 0;
}
```

### Execution Walkthrough
1. The program starts by declaring two variables, `myInteger` and `myString`, with initial values of `10` and `"Hello"`, respectively.
2. The program then prints the initial values of `myInteger` and `myString` to the console.
3. The program updates the values of `myInteger` and `myString` to `20` and `"World"`, respectively, using the assignment operator (=).
4. Finally, the program prints the updated values of `myInteger` and `myString` to the console.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the initial value of the variable `myInteger`?

**Implementation Challenge**: Suppose you want to store a user's name in a variable and then print out a greeting message. How would you declare and use a variable to achieve this?

**Debug Challenge**: Find the memory leak/bug in the following code: ```cpp
int* myFunction() {
    int myVariable = 10;
    return &myVariable;
}

int main() {
    int* ptr = myFunction();
    std::cout << *ptr << std::endl;
    return 0;
}
```

```

---

### Answer Key
* L1_SCENARIO: The initial value of the variable `myInteger` is `10`.
* L2_IMPLEMENTATION: You can declare a variable `userName` of type `std::string` and assign it the user's input. Then, you can print out a greeting message using the variable. For example: ```cpp
std::string userName;
std::cout << "Enter your name: ";
std::cin >> userName;
std::cout << "Hello, " << userName << "!" << std::endl;
```
* L3_DEBUG: The bug in the code is that the variable `myVariable` goes out of scope when the function `myFunction()` returns, but the function returns a pointer to `myVariable`. This results in a dangling pointer, which can cause undefined behavior when dereferenced. To fix this, you can dynamically allocate memory for `myVariable` using `new` and `delete`, or use a smart pointer. For example: ```cpp
int* myFunction() {
    int* ptr = new int;
    *ptr = 10;
    return ptr;
}

int main() {
    int* ptr = myFunction();
    std::cout << *ptr << std::endl;
    delete ptr;
    return 0;
}
```