---
title: Function_Definitions
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Modular_Programming]]
source: [[Chapter 5.Pdf]]
source_pages:
- 8
- 9
- 10
mode: ENGINEER

---

# Definition & Mechanics
A **function definition** in C++ is a block of code that performs a specific task and can be called multiple times from different parts of a program. 
* It consists of: 
  + **Function header**: return type, name, and parameter list
  + **Function body**: the code that executes when the function is called
* Key components:
  + **Return type**: the data type of the value returned by the function
  + **Function name**: a unique identifier for the function
  + **Parameter list**: a list of variables that are passed to the function

# Worked Example
Domain: Film production

Suppose we want to calculate the total cost of producing a movie. We can define a function `calculate_total_cost` that takes the costs of equipment, personnel, and location as parameters.

cpp
#include <iostream>

double calculate_total_cost(double equipment_cost, double personnel_cost, double location_cost) {
  return equipment_cost + personnel_cost + location_cost;
}

int main() {
  double equipment_cost = 100000.0;
  double personnel_cost = 500000.0;
  double location_cost = 200000.0;

  double total_cost = calculate_total_cost(equipment_cost, personnel_cost, location_cost);

  std::cout << "Total cost: " << total_cost << std::endl;

  return 0;
}
```text