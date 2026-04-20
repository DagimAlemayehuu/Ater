---
title: Call by Reference
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 40
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
Imagine you're trying to get a friend's help with moving. You don't just tell them about the move; you also give them a list of items to carry. This way, they can directly pick up the items and help you. In programming, 'Call by Reference' works similarly. Instead of just copying the value of a variable to a function, you pass a reference to the original variable. This allows the function to directly access and modify the original variable.

## 2. Technical Deep-Dive
In the context of programming languages, particularly those that support pass-by-reference semantics like C++, the concept of 'Call by Reference' is crucial. When a function is called with an argument passed by reference, what gets passed is not the value of the argument but a reference to the original variable. This is often achieved through the use of pointers (`int*`) or reference operators (`int&`).

   ### Key Concepts:
   - **Pass-by-Reference**: The actual parameter (the variable passed to the function) is passed to the function. Changes made to the parameter within the function affect the original variable.
   - **Pointers**: Variables that hold the memory addresses of other variables. 
   - **Reference**: An alias for an existing variable.

   ### Mechanism:
   When a variable is passed by reference to a function:
   1. **Memory Allocation**: The variable is stored in memory (RAM), and it has an address.
   2. **Passing Reference**: Instead of copying the value of the variable, the address (or reference) of the variable is passed to the function.
   3. **Function Operations**: The function can then use this reference to access and modify the original variable.

   ### Example in C++:

```cpp
   #include <iostream>

   void swapByReference(int& a, int& b) {
       int temp = a;
       a = b;
       b = temp;
   }

   int main() {
       int x = 5;
       int y = 10;

       std::cout << "Before swap: x = " << x << ", y = " << y << std::endl;
       swapByReference(x, y);
       std::cout << "After swap: x = " << x << ", y = " << y << std::endl;

       return 0;
   }
   
   In this example, `swapByReference` function swaps the values of `x` and `y` in the `main` function because it operates directly on the original variables through references.

```

   ### Advantages:
   - **Efficiency**: No need to copy large data structures.
   - **Flexibility**: The function can modify the original variable.

   ### Disadvantages:
   - **Security Risks**: Functions can modify variables in unexpected ways.
   - **Complexity**: Can make code harder to understand and debug.

   Understanding 'Call by Reference' is essential for effective and efficient programming, especially when dealing with large data structures or when a function needs to modify external state.

## 3. Step-by-Step Visualization
### The Artifact

### Call by Reference vs Call by Value

| Criteria | Call by Value | Call by Reference |
| ---------- | --------------- | -------------------- |
| **Passed to Function** | Copy of the value | Reference to the original variable |
| **Modification** | Does not affect the original variable | Affects the original variable |
| **Memory Usage** | Higher due to copying | Lower as no copying is done |
| **Efficiency** | Less efficient for large data | More efficient for large data |

```cpp
  // Call by Value Example
  void incrementByValue(int a) {
      a++;
  }

  // Call by Reference Example
  void incrementByReference(int& a) {
      a++;
  }

  int main() {
      int value = 5;

      incrementByValue(value);
      std::cout << "Value after call by value: " << value << std::endl; // Outputs 5

      incrementByReference(value);
      std::cout << "Value after call by reference: " << value << std::endl; // Outputs 6

      return 0;
  }
```

### Logic Walkthrough / Execution Trace
1. **Initialization**: We start with a variable `value` initialized to 5.
   2. **Call by Value**: The `incrementByValue` function is called with `value` as the argument. A copy of `value` (which is 5) is made and passed to the function. The function increments the copy to 6, but this change does not affect the original `value` in `main`.
   3. **Call by Reference**: The `incrementByReference` function is called with `value` as the argument. A reference to `value` is passed to the function. The function increments the original `value` to 6.

   The key observation here is that changes made through 'Call by Reference' affect the original variable, whereas changes made through 'Call by Value' do not.

## 4. The Trap (Edge Case Analysis)
A common pitfall with 'Call by Reference' is not realizing that the function can modify the original variable. This can lead to bugs that are hard to track down, especially in large codebases.

  **Solution**: Always document functions that use 'Call by Reference' clearly, indicating which parameters are modified. Use const references (`int& const`) when the function should not modify the variable.