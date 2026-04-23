---
read: false
---

# 1. Technical Definition
In C++, a `function` is a block of code that can be called multiple times from different parts of a program, and it is defined using the `return-type` followed by the `function-name` and parameters in parentheses. A function typically has a specific purpose, such as calculating a value or performing a specific action, and it can take `arguments` and return a `value`.

# 2. Mental Model
Imagine you have a recipe to make a sandwich. A function is like a recipe that you can follow to make a sandwich. You put in the ingredients (like bread, cheese, and ham), and the recipe tells you what to do with them to make a sandwich. Just like how you can make multiple sandwiches using the same recipe, a function can be used multiple times in a program to perform the same task.

# 3. Syntax Mechanics
* A function definition in C++ typically starts with a `return-type`, such as `int` or `void`, followed by the `function-name` and parameters in parentheses.
* Parameters are specified in the form of `type parameter-name`, and multiple parameters are separated by commas.
* A function body is enclosed in curly brackets `{}` and contains the code that is executed when the function is called.
* Functions can be called by their name followed by parentheses containing the required arguments.

# 4. Memory Lifecycle
* Functions have a limited scope, meaning that variables declared inside a function are only accessible within that function.
* Functions can take a limited number of parameters, which are passed by value or by reference.
* Functions can return a value of a specific type, or `void` if no value is returned.
* Recursive functions can lead to stack overflow if not implemented carefully, as each recursive call adds a layer to the call stack.

---

## 5. Worked Example

```cpp
#include <iostream>

int addNumbers(int a, int b) {
    int sum = a + b;
    return sum;
}

int main() {
    int num1 = 5;
    int num2 = 10;
    int result = addNumbers(num1, num2);
    std::cout << "The sum is: " << result << std::endl;
    return 0;
}
```

### Execution Walkthrough
1. The program includes the necessary iostream library for input/output operations.
2. The `addNumbers` function is defined, which takes two integer parameters `a` and `b`, adds them together, and returns the sum.
3. In the `main` function, two integer variables `num1` and `num2` are declared and initialized with values 5 and 10, respectively.
4. The `addNumbers` function is called with `num1` and `num2` as arguments, and the returned sum is stored in the `result` variable.
5. The sum is then printed to the console using `std::cout`.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the primary purpose of a function in C++?

**Implementation Challenge**: Write a C++ function that calculates the area of a rectangle given its length and width, and then use this function to calculate the area of a rectangle with a length of 8 and a width of 5.

**Debug Challenge**: Find the memory leak/bug in the provided code block: 
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
* L1_SCENARIO: A function in C++ is a block of code that can be called multiple times from different parts of a program to perform a specific task.
* L2_IMPLEMENTATION: 
```cpp
int calculateArea(int length, int width) {
    int area = length * width;
    return area;
}

int main() {
    int length = 8;
    int width = 5;
    int area = calculateArea(length, width);
    std::cout << "The area is: " << area << std::endl;
    return 0;
}
```
* L3_DEBUG: The bug in the provided code block is a memory leak. The `createArray` function dynamically allocates memory for an array using `new`, but the memory is never deallocated. To fix this, the `delete[]` operator should be used to deallocate the memory when it is no longer needed. 

```cpp
int* createArray(int size) {
    int* arr = new int[size];
    return arr;
}

int main() {
    int* arr = createArray(10);
    // ...
    delete[] arr; // Deallocate the memory
    return 0;
}
```