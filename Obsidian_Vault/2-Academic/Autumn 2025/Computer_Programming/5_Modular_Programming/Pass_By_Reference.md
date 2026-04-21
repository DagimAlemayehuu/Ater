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
## Explanation

Imagine you're handing a friend a piece of paper with a number on it, and you ask them to increase that number by one. Instead of giving them a copy of the paper, you give them the original paper. They can then modify the number on the original paper, and when you see it again, the number will have changed. This is similar to "pass by reference" in programming, where a function receives a reference to the original variable, allowing it to modify the original variable directly.

## Deep Dive

In the context of the provided C++ code, the `increment` function takes an `int` reference `x` as its parameter. This means that `x` is an alias for the original variable `num` in the `main` function. When `increment` modifies `x`, it's directly modifying `num`.

The key concept here is that of **lvalue references** (`int &x`). An lvalue reference is a reference to an existing object, and it must be bound to an lvalue (an expression that refers to a memory location). In this case, `num` is an lvalue, and `x` is a reference to `num`.

When we pass `num` to `increment`, we're not creating a copy of `num`; instead, we're passing the memory address of `num` to `increment`. This allows `increment` to access and modify the original `num` variable.

The benefits of pass by reference include:

*   **Efficiency**: No copying of large objects is required.
*   **Mutability**: The function can modify the original variable.

However, it's essential to note that pass by reference also introduces the risk of **aliasing**, where multiple names refer to the same memory location. This can lead to unexpected behavior if not managed carefully.

## Artifact

```cpp
#include <iostream>

void increment(int &x) { // x is a reference to the original variable
    x = x + 1; // modifies the original variable
}

int main() {
    int num = 5; // original variable
    increment(num); // pass num by reference
    std::cout << num; // Output: 6
    return 0;
}
```

## Walkthrough

1.  We declare an `int` variable `num` in `main` and initialize it to 5.
2.  We pass `num` to the `increment` function, which receives a reference to `num` through its `int &x` parameter.
3.  Inside `increment`, we modify `x` (which is a reference to `num`) by incrementing its value.
4.  Since `x` is a reference to `num`, the modification affects the original `num` variable in `main`.
5.  Finally, we print the value of `num` in `main`, which is now 6.

## The Trap

A subtle failure mode to watch out for is **dangling references**. If a reference is bound to a temporary object or an object that goes out of scope, the reference becomes invalid. For example:

```cpp
int &get_ref() {
    int temp = 5; // temporary object
    return temp; // returns a reference to a temporary object
}

int main() {
    int &ref = get_ref(); // ref is a dangling reference
    std::cout << ref; // undefined behavior
    return 0;
}
```

To avoid this trap, ensure that references are always bound to valid objects with a sufficient lifetime.

## Search Keywords

*   Pass by reference
*   Lvalue references
*   C++ references
*   Memory aliasing
*   Dangling references
*   C++ efficiency
*   Function parameters

To extract the page numbers, I need the source text with [PAGE X] markers. Please provide the source text with markers. I will then return the page numbers in JSON format.

Assuming I have the source text, here is a sample JSON output:

```json
{
    "source_pages": [1, 2, 3]
}
```


## 2. Technical Deep-Dive
FALLBACK: Check raw JSON block in explanation field.

## 3. Step-by-Step Visualization
### The Artifact

```cpp

```


### Logic Walkthrough / Execution Trace


## 4. The Trap (Edge Case Analysis)