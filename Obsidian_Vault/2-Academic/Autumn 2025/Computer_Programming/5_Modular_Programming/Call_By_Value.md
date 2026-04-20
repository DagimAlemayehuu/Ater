---
title: Call by Value
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 39
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
Imagine you have a piece of paper with a number on it, and you give a copy of that paper to someone else. If they change the number on their copy, it doesn't affect the original number on your paper. That's similar to how call by value works in programming.

## 2. Technical Deep-Dive
In the call by value method, a copy of the actual parameter is passed to the function. Any changes made to the parameter within the function do not affect the original variable outside the function. This method is used in languages like C, C++, and Java. The function `swap` is an example of call by value, where the values of `x` and `y` are copied into `a` and `b`, and the swap operation does not affect the original variables `x` and `y` in the `main` function.

## 3. Step-by-Step Visualization
### The Artifact

```cpp
void swap(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int x = 5;
    int y = 10;
    swap(x, y);
    return 0;
}
```


### Logic Walkthrough / Execution Trace
1. The `main` function initializes two variables, `x` and `y`, with values 5 and 10, respectively.
2. The `swap` function is called with `x` and `y` as arguments.
3. The values of `x` and `y` are copied into the parameters `a` and `b` of the `swap` function.
4. The `swap` function swaps the values of `a` and `b`.
5. The `swap` function returns, and the changes made to `a` and `b` do not affect the original variables `x` and `y` in the `main` function.

## 4. The Trap (Edge Case Analysis)
One common pitfall of call by value is that changes made to the parameters within the function do not persist outside the function. For example, in the `swap` function, the swap operation does not change the original values of `x` and `y` in the `main` function.