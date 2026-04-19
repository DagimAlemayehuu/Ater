---
title: Function_Prototypes
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Modular_Programming]]
source: [[Chapter 5.Pdf]]
source_pages:
- 4
- 5
mode: ENGINEER

---

# Definition & Mechanics
A **function prototype** is a declaration of a function that specifies its **return type**, **name**, and **parameter list**, but not its implementation. It informs the compiler about the function's signature, allowing it to be called before its definition.

* **Components of a function prototype:**
  * **Return type**: the data type of the value returned by the function
  * **Function name**: the identifier used to call the function
  * **Parameter list**: a list of parameters, including their data types and names
* **Purpose:** to provide a contract or interface for the function, enabling other parts of the program to use it

# Worked Example
Domain: Aerospace engineering

Suppose we want to calculate the trajectory of a spacecraft using a function `calculate_trajectory`. We define a function prototype to inform the compiler about the function's signature.

cpp
// Function prototype
double calculate_trajectory(double mass, double velocity, double angle);
```text