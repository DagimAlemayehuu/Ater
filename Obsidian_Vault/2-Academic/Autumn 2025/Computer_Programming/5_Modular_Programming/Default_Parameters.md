---
title: Default Parameters
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 34
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[External Storage Class]]"
---

# 1. Technical Definition
In programming, a function with `default parameters` is defined as a function that allows one or more parameters to have a default value, which is used when no argument is passed for that parameter. The syntax for default parameters involves assigning a value to a parameter using the `=` operator, such as `function foo(bar = 'baz')`.

# 2. Mental Model
Imagine you have a lemonade stand and you want to offer a special deal where customers can buy lemonade with a default amount of sugar. If they don't specify how much sugar they want, you automatically add a certain amount. In programming, default parameters work similarly - if a value isn't provided for a parameter, the function uses a pre-set default value.

# 3. Syntax Mechanics
* Default parameter values are specified using the `=` operator after the parameter name.
* Default parameters must be listed after non-default parameters in the function signature.
* When calling a function with default parameters, arguments can be omitted for parameters with default values.
* Default parameter values can be any valid expression, including function calls.

# 4. Memory Lifecycle
* Default parameter values are evaluated only once at the point of function definition in the defining scope.
* If a default parameter value is a mutable object, such as an array or object, and it's modified, the changes will be reflected in subsequent function calls.
* There is a limit to the number of parameters a function can have, which can vary depending on the programming language.
* Default parameters do not affect the number of arguments a function can accept, but they do affect how many arguments are required.

---

## 5. Worked Example

```cpp
#include <iostream>
#include <string>

std::string greet(const std::string& name = "World") {
    return "Hello, " + name + "!";
}

int main() {
    std::cout << greet() << std::endl;  // Output: Hello, World!
    std::cout << greet("John") << std::endl;  // Output: Hello, John!
    return 0;
}
```

### Execution Walkthrough
1. The `greet` function is defined with a default parameter `name` set to `"World"`.
2. In the `main` function, `greet()` is called without any arguments, so it uses the default value `"World"`.
3. The second call to `greet("John")` passes an argument `"John"`, which overrides the default value.

---

## 6. Socratic Probes

**Scenario-Based Question**: What is the default value of the `name` parameter in the `greet` function?

**Implementation Challenge**: Write a function that takes a single parameter `age` with a default value of `18`, and returns a string indicating whether the person is an adult or not.

**Debug Challenge**: Find the bug in the following code: ```cpp
void foo(int x = 5) {
    int* p = new int;
    *p = x;
    // delete p; // commented out
}
```

```

---

### Answer Key
- L1_SCENARIO: The default value of the `name` parameter is `"World"`.
- L2_IMPLEMENTATION: ```cpp
std::string isAdult(int age = 18) {
    if (age >= 18) {
        return "The person is an adult.";
    } else {
        return "The person is not an adult.";
    }
}
```
- L3_DEBUG: The bug is a memory leak. The dynamically allocated memory for `int* p` is not deallocated, which can cause memory leaks. The fix is to add `delete p;` at the end of the `foo` function. 

However since there are mutiple answers for L3_DEBUG. A more precise L3 Debug would be 
```

### L3_DEBUG: 
Identify a potential issue in the following code that uses default parameters and dynamic memory allocation:
```cpp
void foo(int* arr = nullptr) {
    if (arr == nullptr) {
        arr = new int[10];
    }
    // use arr
    // ...
    // delete[] arr; // commented out
}
```
### L3_DEBUG Answer 
The bug in this case is the commented out `delete[] arr;` If `arr` was dynamically allocated and not provided as an argument, it will cause a memory leak when `foo` returns. 

The fix would then be 
```cpp
void foo(int* arr = nullptr) {
    bool allocatedLocally = false;
    if (arr == nullptr) {
        arr = new int[10];
        allocatedLocally = true;
    }
    // use arr
    // ...
    if (allocatedLocally) {
        delete[] arr;
    }
}
```