---
title: Global Variables
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 21
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
Global variables are variables declared outside of any function or class. They are accessible from any part of the program.

## 2. Technical Deep-Dive
In C++, a global variable is defined outside of any function or class. The scope of a global variable is the entire program. This means it can be accessed from any function or class within the program. However, overuse of global variables can lead to namespace pollution and make the program harder to understand and debug. It's essential to use them sparingly and follow best practices.

## 3. Step-by-Step Visualization
### The Artifact

```cpp
// Global variable
int globalVar = 10;

void myFunction() {
    // Accessing the global variable
    cout << globalVar << endl;
}
```

## Step 1: Understanding Global Variables
Global variables are variables declared outside of any function or class. They are accessible from any part of the program, making them a crucial concept in programming, especially in C++.

## Step 2: Defining Global Variables
In C++, a global variable is defined outside of any function or class. Here's a simple example:

```cpp
// Global variable
int globalVar = 10;

void myFunction() {
    // Accessing the global variable
    cout << globalVar << endl;
}
```

## Step 3: Scope of Global Variables
The scope of a global variable is the entire program. This means it can be accessed from any function or class within the program.

## 4: Global Variables and Local Variables
When a local variable has the same name as a global variable, the local variable hides the global variable within its scope.

```cpp
int globalVar = 10;

void myFunction() {
    int globalVar = 20; // Local variable
    cout << globalVar << endl; // Outputs 20
}

int main() {
    myFunction();
    cout << globalVar << endl; // Outputs 10
    return 0;
}
```

## 5: Using the `extern` Keyword
The `extern` keyword is used to declare a global variable without defining it. The definition of the variable must be provided elsewhere in the program.

```cpp
// File1.cpp
extern int globalVar;

void myFunction() {
    cout << globalVar << endl;
}

// File2.cpp
int globalVar = 10;
```

## 6: Best Practices
While global variables can be useful, they should be used sparingly. Overuse of global variables can lead to namespace pollution and make the program harder to understand and debug.

## 7: Example Use Case
Here's an example that demonstrates the use of a global variable to keep track of the number of instances of a class:

```cpp
#include <iostream>

int instanceCount = 0;

class MyClass {
public:
    MyClass() {
        instanceCount++;
    }

    ~MyClass() {
        instanceCount--;
    }

    static int getInstanceCount() {
        return instanceCount;
    }
};

int main() {
    MyClass obj1;
    MyClass obj2;

    std::cout << "Instance count: " << MyClass::getInstanceCount() << std::endl;

    return 0;
}
```

## 8: Common Pitfalls
One common pitfall with global variables is that they can be modified accidentally. This can lead to unexpected behavior in the program.

## 9: Alternatives to Global Variables
Alternatives to global variables include passing variables as arguments to functions or using classes to encapsulate data.

### Logic Walkthrough / Execution Trace
## Step 1: Understanding Global Variables
Global variables are variables declared outside of any function or class. They are accessible from any part of the program, making them a crucial concept in programming, especially in C++.

## Step 2: Defining Global Variables
In C++, a global variable is defined outside of any function or class. Here's a simple example:

```cpp
// Global variable
int globalVar = 10;

void myFunction() {
    // Accessing the global variable
    cout << globalVar << endl;
}
```

## Step 3: Scope of Global Variables
The scope of a global variable is the entire program. This means it can be accessed from any function or class within the program.

## 4: Global Variables and Local Variables
When a local variable has the same name as a global variable, the local variable hides the global variable within its scope.

```cpp
int globalVar = 10;

void myFunction() {
    int globalVar = 20; // Local variable
    cout << globalVar << endl; // Outputs 20
}

int main() {
    myFunction();
    cout << globalVar << endl; // Outputs 10
    return 0;
}
```

## Step 5: Using the `extern` Keyword
The `extern` keyword is used to declare a global variable without defining it. The definition of the variable must be provided elsewhere in the program.

```cpp
// File1.cpp
extern int globalVar;

void myFunction() {
    cout << globalVar << endl;
}

// File2.cpp
int globalVar = 10;
```


## 4. The Trap (Edge Case Analysis)
One common pitfall with global variables is that they can be modified accidentally. This can lead to unexpected behavior in the program.

---

## 5. Question

**Scenario-Based Question**: What happens if a global variable is accessed from multiple functions in a C++ program?

**Implementation Challenge**: A global variable 'x' is defined and initialized to 5. Two functions, 'func1' and 'func2', are defined. 'func1' increments 'x' by 1, and 'func2' prints the value of 'x'. If 'func1' is called followed by 'func2', what will be the output?

**Socratic Debugger**:

```cpp
int x = 5;
void func1() {
    x++;
}
void func2() {
    cout << x;
}

int main() {
    func1();
    func2();
    return 0;
}
```
The code has a subtle bug. The bug is that the global variable 'x' is being modified accidentally. How can you fix this bug to ensure 'func2' prints the expected value?