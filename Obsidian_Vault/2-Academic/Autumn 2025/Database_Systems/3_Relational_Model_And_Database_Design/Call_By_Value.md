---
title: Call_By_Value
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Function_Parameters]]
source: [[Chapter 5.Pdf]]
source_pages:
- 39
- 40
- 41
mode: ENGINEER

---

# Definition & Mechanics
**Call by Value** is a parameter passing mechanism where a copy of the actual parameter's value is passed to the formal parameter. Changes made to the formal parameter do not affect the actual parameter.

* **Key characteristics:**
  + A copy of the data is passed to the function.
  + Changes to the copy do not change the original variable.
* **Example syntax:** `void increment(int x) { x = x + 1; }`
* **Use cases:** When the function should not modify the original variable.

# Worked Example
Domain: Film production

Suppose we have a function to calculate the total cost of a movie production, and we want to increment the budget by a certain amount without modifying the original budget.

cpp
#include <iostream>

void incrementBudget(int budget) {
  budget = budget + 1000;
  std::cout << "Incremented budget: " << budget << std::endl;
}

int main() {
  int originalBudget = 5000;
  std::cout << "Original budget: " << originalBudget << std::endl;
  incrementBudget(originalBudget);
  std::cout << "Original budget after increment: " << originalBudget << std::endl;
  return 0;
}
```text

Output:
```
Original budget: 5000
Incremented budget: 6000
Original budget after increment: 5000
```text