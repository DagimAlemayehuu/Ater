---
title: Unary Scope Resolution Operator
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 24
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
The unary scope resolution operator is used to access global variables when a local variable with the same name is in scope.

## 2. Technical Deep-Dive
In C++, when a local variable has the same name as a global variable, the local variable 'shadows' or 'hides' the global variable. To access the global variable, the unary scope resolution operator `::` can be used. This operator is a unary operator that can be used to qualify a name with the scope of a global variable. 

For example, consider the following code:

```cpp
int x = 10; // global variable

void foo() {
    int x = 20; // local variable
    ::x = 30;   // access global variable using unary scope resolution operator
}

int main() {
    foo();
    return 0;
}

In this example, `::x` refers to the global variable `x`. Without the unary scope resolution operator, it would be impossible to access the global variable `x` from within the `foo()` function.

The unary scope resolution operator can also be used to define functions outside a class definition:

```

```cpp
class MyClass {
public:
    void myFunction();
};

void MyClass::myFunction() { // unary scope resolution operator used to define function outside class definition
    // function implementation
}

In this case, `MyClass::` is used to specify that `myFunction()` is a member of `MyClass`.

The unary scope resolution operator can also be used with namespaces:

```

```cpp
namespace MyNamespace {
    int x = 10;
}

int main() {
    int x = 20;
    ::MyNamespace::x = 30; // access variable in namespace using unary scope resolution operator
    return 0;
}

In summary, the unary scope resolution operator `::` is a powerful tool in C++ that allows programmers to access global variables and namespace members when local variables or other identifiers have the same name.
```

## 3. Step-by-Step Visualization
### The Artifact

### Unary Scope Resolution Operator Use Cases

| Use Case | Description | Code Example |
| --- | --- | --- |
| Accessing Global Variables | Accessing global variables when a local variable with the same name is in scope | cpp |

int x = 10;
void foo() {
    int x = 20;
    ::x = 30;
}

|  |
| --- |
| Defining Functions Outside Class Definition | Defining functions outside a class definition | cpp |

class MyClass {
public:
    void myFunction();
};
void MyClass::myFunction() {
    // function implementation
}

|  |
| --- |
| Accessing Namespace Members | Accessing namespace members when a local variable or identifier has the same name | cpp |

namespace MyNamespace {
    int x = 10;
}
int main() {
    int x = 20;
    ::MyNamespace::x = 30;
    return 0;
}

|  |
| --- |


### Logic Walkthrough / Execution Trace
1. A global variable `x` is declared and initialized to 10.
2. A local variable `x` is declared and initialized to 20 within the `foo()` function.
3. The unary scope resolution operator `::` is used to access the global variable `x` and assign it the value 30.
4. The `foo()` function is called from `main()`.
5. The program terminates.

## 4. The Trap (Edge Case Analysis)
A common pitfall when using the unary scope resolution operator is forgetting that it can only be used to access global variables or namespace members, not local variables. For example:

```cpp
void foo() {
    int x = 20;
    ::x = 30; // Error: ::x is not a global variable or namespace member
}

To fix this error, ensure that the variable or identifier being accessed is indeed global or a namespace member.
```

---

## 5. Question

**Scenario-Based Question**: What happens if a local variable with the same name as a global variable is declared in a function and the unary scope resolution operator is used to access the global variable?

**Implementation Challenge**: A global variable `x` is declared and initialized to 10. A local variable `x` is declared and initialized to 20 within a function `foo()`. Use the unary scope resolution operator to assign the value 30 to the global variable `x`.

**Socratic Debugger**:

```cpp
void foo() {
    int x = 20;
    ::y = 30; // Error: ::y is not a global variable or namespace member
}
```

How to fix this error?