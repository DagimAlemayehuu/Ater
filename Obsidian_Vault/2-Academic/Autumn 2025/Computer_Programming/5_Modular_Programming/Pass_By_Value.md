---
title: Pass by Value
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
Imagine you have a box where you store a number. When you pass this box's content to someone, you make a copy of the number and give it to them. If they change the number in their copy, your original box remains unchanged. This is similar to pass by value in programming, where a copy of the original data is made and passed to the function.

## 2. Technical Deep-Dive
In C++, when passing arguments to a function, one of the fundamental concepts is pass by value. This method involves creating a local copy of the original argument within the function. Any modifications made to the argument within the function do not affect the original variable outside the function. This is because the function is working with a copy of the data, not the actual data itself. 

The process can be detailed as follows:
1. **Pass by Value Mechanism**: When a function is called with arguments, the values of the arguments are copied into the function's parameters. 
2. **Local Modifications**: Any changes made to these parameters within the function affect only the local copies, not the original variables.
3. **Scope and Lifetime**: The local copies of the parameters are destroyed once the function execution is completed, and control returns to the caller.

To illustrate this concept, consider the example of swapping two integers using a function. The function `swap_by_value` takes two integers `a` and `b` by value. Inside the function, a temporary variable `temp` is used to swap the values of `a` and `b`. However, this swap operation only affects the local copies of `a` and `b` within the function. The original variables `x` and `y` in the `main` function remain unchanged after the function call.

## 3. Step-by-Step Visualization
### The Artifact

```cpp
void swap_by_value(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int x = 5;
    int y = 10;
    swap_by_value(x, y);
    // x and y remain unchanged
    return 0;
}
```


### Logic Walkthrough / Execution Trace
1. The `main` function initializes two integers `x` and `y` with values 5 and 10, respectively.
2. The `swap_by_value` function is called with `x` and `y` as arguments.
3. Within `swap_by_value`, local copies of `x` and `y` are made into `a` and `b`.
4. The values of `a` and `b` are swapped using a temporary variable.
5. The function ends, and the local copies `a` and `b` are destroyed.
6. The original variables `x` and `y` in `main` remain unchanged.

## 4. The Trap (Edge Case Analysis)
A common pitfall with pass by value is trying to modify the original variable through the function, which does not work as expected. The solution is to use pass by reference or pass by pointer if the goal is to modify the original variables.