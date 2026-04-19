---
title: Functions_In_Cpp
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Modular_Programming]]
source: [[Chapter 5.Pdf]]
source_pages:
- 3
- 4
- 5
mode: ENGINEER

---

# Definition & Mechanics
In C++, a **function** is a subprogram that can act on data and return a value. It is a block of code that can be called multiple times from different parts of a program.

* **Key components**: 
  + **Return type**: the data type of the value returned by the function
  + **Function name**: the name given to the function
  + **Parameters**: the inputs to the function
* **Function types**: 
  + **User-defined**: defined by a programmer/user
  + **Built-in**: already defined in C++ software

# Worked Example
Domain: Film production

Suppose we want to calculate the total cost of producing a movie. We can define a function `calculate_total_cost` that takes the costs of equipment, crew, and location as parameters.

cpp
#include <iostream>

double calculate_total_cost(double equipment_cost, double crew_cost, double location_cost) {
  return equipment_cost + crew_cost + location_cost;
}

int main() {
  double equipment_cost = 100000;
  double crew_cost = 50000;
  double location_cost = 200000;
  double total_cost = calculate_total_cost(equipment_cost, crew_cost, location_cost);
  std::cout << "Total cost: " << total_cost << std::endl;
  return 0;
}
```text