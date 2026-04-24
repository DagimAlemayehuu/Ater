---
title: Default Parameters
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages: []
mode: CS-CODE
read: false
generated: true
---

# 1. Technical Definition
Default parameters are a feature of the `function` definition in which certain `parameters` are assigned a default value, allowing for optional arguments to be omitted during invocation. This enables a function to be called with fewer arguments than the number of parameters it is defined with, by providing default values for the omitted arguments using the `=` operator.

# 2. Syntax Mechanics
* Default parameters are defined using the `=` operator in the `function` parameter list, where a default value is assigned to a parameter.
* The syntax for default parameters is `parameter_name type = default_value`, where `parameter_name` is the name of the parameter and `default_value` is the value assigned to it.
* Default parameters must be specified after non-default parameters in the `function` parameter list.
* A `function` can have multiple default parameters.

# 3. Memory Lifecycle
* Default parameters are evaluated only once at the point of `function` definition in the defining scope.
* The memory allocated for default parameters is retained throughout the lifetime of the program.
* Changes to the default parameter values do not affect existing `function` calls.
* The scope of default parameters is limited to the `function` definition, and they are not accessible outside of it.

---

## 4. Worked Example

```cpp
#include <iostream>
#include <string>

// Example function with default parameters
void greet(const std::string& name = "World", const std::string& message = "Hello") {
    std::cout << message << ", " << name << std::endl;
}

int main() {
    // Test the function with default parameters
    greet();  // Output: Hello, World
    greet("John");  // Output: Hello, John
    greet("John", "Hi");  // Output: Hi, John

    return 0;
}
```

---

## 5. Knowledge Check

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the purpose of default parameters in a function definition?",
    "options": {
      "A": "To allow for optional arguments to be omitted during function invocation",
      "B": "To increase the number of required arguments",
      "C": "To decrease the number of function parameters",
      "D": "To change the return type of the function"
    },
    "answer": "A",
    "explanation": "Default parameters allow for optional arguments to be omitted during function invocation by providing default values for the omitted arguments."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A function is defined with two parameters, 'a' and 'b', where 'b' has a default value. What happens when the function is called with only one argument?",
    "answer": "The function will use the default value for 'b'.",
    "explanation": "When a function is called with fewer arguments than the number of parameters it is defined with, the default values are used for the omitted arguments."
  },
  {
    "id": "q3",
    "type": "code",
    "difficulty": "L3",
    "question": "What is the output of the following code snippet?",
    "codeSnippet": "void foo(int& x = 5) { x++; }\nint main() {\n    int y = 10;\n    foo(y);\n    std::cout << y << std::endl;\n    foo();\n    std::cout << y << std::endl;\n    return 0;\n}",
    "answer": "11\n11",
    "explanation": "The code snippet demonstrates the use of default parameters with references. The output is 11 11 because the default parameter is a reference and its value is changed in the first call to foo(). In the second call to foo(), the default parameter is used and its value is changed again."
  }
]
```