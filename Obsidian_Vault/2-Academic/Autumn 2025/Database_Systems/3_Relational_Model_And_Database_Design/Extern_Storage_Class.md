---
title: Extern_Storage_Class
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Storage_Class]]
source: [[Chapter 5.Pdf]]
source_pages:
- 31
- 32
mode: ENGINEER

---

# Definition & Mechanics
The **extern** storage class in C++ is used to access a global variable defined in another file. 
* **Global variable accessibility**: allows access to a global variable from any file.
* **External linkage**: the variable or function is accessible from other files.
* **Definition**: the variable or function is defined only once in one file.
* **Declaration**: the variable or function is declared with `extern` in other files.

# Worked Example
Domain: Banking system

Suppose we have a global variable `account_balance` defined in `file1.cpp`:

cpp
// file1.cpp
int account_balance = 1000;
```text

We can access this variable in `file2.cpp` using the `extern` storage class:

```cpp
// file2.cpp
extern int account_balance;

void display_balance() {
    cout << "Account balance: " << account_balance << endl;
}
```

# Edge Case
> **Q:** What happens if we define a local variable with the same name as a global variable declared with `extern`?
> **A:** The local variable hides the global variable. To access the global variable, we use the unary scope resolution operator `::`.

cpp
int x = 10; // global variable

void myFunction() {
    int x = 20; // local variable
    cout << ::x << endl; // access global variable
}
```text