---
read: true
---

# 1. Technical Definition
A function declaration is a statement that defines a function with a specified `name`, `return-type`, and `parameter-list`, allowing the function to be called later in the code. The general syntax for a function declaration is `return-type name ( parameter-list );`, where `return-type` is the data type of the value returned by the function, `name` is the identifier for the function, and `parameter-list` is a list of variables that are passed to the function.

# 2. Mental Model
Imagine you have a recipe book where you write down how to make your favorite dishes. A function declaration is like writing down the recipe itself, including the name of the dish, what ingredients you need (parameters), and what the dish looks like when it's done (return type). Just like how you can follow a recipe to make a dish, a function declaration tells the computer how to perform a specific task.

# 3. Syntax Mechanics
* A function declaration starts with a `return-type` that specifies the data type of the value returned by the function.
* The `name` of the function follows, which is an identifier that uniquely names the function.
* A `parameter-list` is specified in parentheses, which defines the input parameters of the function.
* The function declaration ends with a semicolon `;`.

# 4. Memory Lifecycle
* A function declaration does not allocate memory for the function's code, but it does reserve space for the function's name and parameters in the symbol table.
* The function declaration is typically stored in the program's binary or compiled form.
* When the function is called, memory is allocated for the function's local variables and parameters on the call stack.
* The function's memory allocation is limited by the stack size limit, which can cause a stack overflow error if exceeded.

---

## 5. Worked Example

```cpp
int addNumbers(int a, int b);
```

### Execution Walkthrough
1. The compiler encounters the function declaration `int addNumbers(int a, int b);`.
2. The compiler stores the function declaration in the symbol table, which includes the function's name `addNumbers`, return type `int`, and parameter list `(int a, int b)`.
3. The function declaration does not allocate memory for the function's code, but it reserves space for the function's name and parameters in the symbol table.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the purpose of a function declaration in C++?

**Implementation Challenge**: Write a C++ program that declares a function `int addNumbers(int a, int b);` and calls it with two integer arguments.

**Debug Challenge**: Find the memory leak/bug in the following code:
```cpp
int* createArray(int size) {
    int* arr = new int[size];
    return arr;
}

int main() {
    int* arr = createArray(10);
    // ...
    return 0;
}
```

---

### Answer Key
* L1_SCENARIO: A function declaration in C++ defines a function with a specified name, return type, and parameter list, allowing the function to be called later in the code.
* L2_IMPLEMENTATION: Here is a C++ program that declares a function `int addNumbers(int a, int b);` and calls it with two integer arguments:
```cpp
int addNumbers(int a, int b) {
    return a + b;
}

int main() {
    int result = addNumbers(5, 10);
    return 0;
}
```
* L3_DEBUG: The memory leak/bug in the code is that the dynamically allocated memory for the array `arr` is not deallocated. To fix this, we need to add `delete[] arr;` in the `main` function after we're done using the array. Alternatively, we can use smart pointers or containers like `std::vector` to manage memory automatically. 

The corrected code would look like this:
```cpp
int* createArray(int size) {
    int* arr = new int[size];
    return arr;
}

int main() {
    int* arr = createArray(10);
    // ...
    delete[] arr;
    return 0;
}
```