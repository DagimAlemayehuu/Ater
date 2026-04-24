---
read: true
---

# 1. Technical Definition
In C++, case sensitivity refers to the distinction between uppercase and lowercase letters in `identifier` names, `keyword` usage, and `variable` declarations. The C++ compiler treats `variableName` and `variablename` as two different identifiers due to its case-sensitive nature.

# 2. Mental Model
Imagine you have a huge library with millions of books, and each book has a unique title. If the library uses case sensitivity, "HarryPotter" and "harrypotter" would be considered two different book titles, even though they seem similar. This means that when searching for a specific book, you need to use the exact title, including the correct capitalization.

# 3. Syntax Mechanics
* In C++, `int`, `double`, and `char` are keywords that must be written in lowercase.
* Variable names, such as `myVariable`, are case-sensitive and must be declared and used consistently.
* Function names, like `main()`, are also case-sensitive and must match their declaration.
* Preprocessor directives, including `#include`, are case-insensitive but conventionally written in lowercase.

# 4. Memory Lifecycle
* C++ has no inherent limit on variable name length, but it must adhere to the rules of `identifier` naming.
* Case sensitivity applies throughout the program, including in `function` calls and `variable` accesses.
* Changing the case of a variable or function name can lead to compilation errors if not updated consistently.
* There is no specific threshold for the number of case-sensitive characters allowed in an identifier.

type: "Atomic Note"
---

## 5. Worked Example

```cpp
#include <iostream>
using namespace std;

int main() {
    int variableName = 10;
    int variablename = 20;

    cout << "variableName: " << variableName << endl;
    cout << "variablename: " << variablename << endl;

    // Trying to use a variable with different case
    // int VariableName = 30; // Uncomment to see compilation error

    return 0;
}
```

### Execution Walkthrough
1. The program starts by including the necessary iostream header file and using the standard namespace.
2. In the main function, two integer variables, `variableName` and `variablename`, are declared and initialized with values 10 and 20, respectively.
3. The program then prints out the values of both variables to demonstrate that they are treated as distinct due to case sensitivity.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the output of the given C++ code block?

**Implementation Challenge**: How would you declare and use a variable named `myVariable` in a C++ program to store the value 50?

**Debug Challenge**: Find the bug in the code block below and explain how to fix it: ```cpp
int main() {
    int MyVariable = 10;
    int myvariable = 20;
    cout << "MyVariable: " << myVariable << endl; // Trying to print MyVariable but with wrong case
    return 0;
}
```

```

---

### Answer Key
- **L1_SCENARIO:** The output of the given C++ code block is:
```
variableName: 10
variablename: 20
```
- **L2_IMPLEMENTATION:** To declare and use a variable named `myVariable` in a C++ program to store the value 50, you would write:
```cpp
int main() {
    int myVariable = 50;
    cout << "myVariable: " << myVariable << endl;
    return 0;
}
```
- **L3_DEBUG:** The bug in the code block is a case sensitivity issue. The variable `MyVariable` is declared but then attempted to be printed using the wrong case `myVariable`. To fix it, you should use the correct case when printing:
```cpp
int main() {
    int MyVariable = 10;
    int myvariable = 20;
    cout << "MyVariable: " << MyVariable << endl; // Fix: Correct case used
    return 0;
}
```