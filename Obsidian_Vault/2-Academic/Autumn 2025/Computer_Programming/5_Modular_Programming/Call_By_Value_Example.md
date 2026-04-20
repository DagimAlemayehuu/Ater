---
title: Call by Value Example
type: Atomic Note
course: "[[Computer Programming]]"
semester: "[[Autumn 2025]]"
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 5.Pdf]]"
source_pages:
- 43
mode: ENGINEER
generated: true
---

## 1. Simple Explanation
In call by value, a copy of the original value is passed to the function. Any changes made to the variable within the function do not affect the original variable outside the function.

## 2. Technical Deep-Dive


## 3. Step-by-Step Visualization
### The Artifact

```cpp

```


### Logic Walkthrough / Execution Trace


## 4. The Trap (Edge Case Analysis)

---

## 5. Question

**Scenario-Based Question**: What happens if a function modifies a variable passed to it by value?

**Implementation Challenge**: A function takes an integer as a parameter by value and increments it by 1. What is the value of the original variable after the function call?

**Socratic Debugger**:

```cpp
void modify(int x) {
  x = x + 1;
}
int main() {
  int originalValue = 5;
  modify(originalValue);
  // What is the value of originalValue here?
  return 0;
}
```