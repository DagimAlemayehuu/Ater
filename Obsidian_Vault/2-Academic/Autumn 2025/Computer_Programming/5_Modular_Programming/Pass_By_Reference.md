---
title: Pass by Reference
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 45
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
Imagine you have a friend who wants to borrow a book from you. If you give your friend a copy of the book, they can read it but can't modify the original book. This is similar to pass by value. However, if you give your friend the actual book and they modify it, the changes affect your original book. This is similar to pass by reference, where the function receives the actual memory location and can modify the original data.

## 2. Technical Deep-Dive
In C++, when passing variables to functions, arguments can be passed in several ways: by value, by reference, or by pointer. Pass by reference involves passing the actual memory location of the variable rather than a copy of the variable. This is achieved using the unary `&` operator in the function parameter list. When a variable is passed by reference, any modifications made to the variable within the function affect the original variable outside the function. This technique is particularly useful for modifying the original data without the overhead of copying large objects. For example, consider a simple function to swap two integers: 

```cpp
void swap(int &a, int &b) {
    int temp = a;
    a = b;
    b = temp;
}
```

In this example, `a` and `b` are passed by reference, allowing the function to swap the values of the original variables. This approach is more efficient than passing by value, especially for large objects, since it avoids the overhead of creating and managing temporary copies.

## 3. Step-by-Step Visualization
### The Artifact

```cpp
void swap(int &a, int &b) {
    int temp = a;
    a = b;
    b = temp;
}
```


### Logic Walkthrough / Execution Trace
1. Define a function with parameters passed by reference using the `&` operator.
2. Call the function with variables as arguments.
3. The function modifies the original variables.

Example:

```cpp
int main() {
    int x = 5;
    int y = 10;
    swap(x, y);
    return 0;
}
```


## 4. The Trap (Edge Case Analysis)
A common pitfall with pass by reference is forgetting that the function can modify the original variable. For instance, if a function is supposed to only calculate a value but accidentally modifies the input variable, it can lead to unexpected behavior. To avoid this, always be aware of which variables are being passed by reference and document the function's behavior clearly.

---

## 5. Question

**Scenario-Based Question**: What happens if a function modifies a variable passed by reference?

**Implementation Challenge**: A function swaps two integers using pass by reference. What is the correct implementation of the function?

**Socratic Debugger**:

```cpp
void swap(int &a, int &b) {
    int temp = a;
    a = a;
    b = temp;
}
```
How can you fix this code to correctly swap the values of `a` and `b`?