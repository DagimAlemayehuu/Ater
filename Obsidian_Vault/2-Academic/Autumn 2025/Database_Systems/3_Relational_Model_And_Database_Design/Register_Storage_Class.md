---
title: Register_Storage_Class
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Storage_Class]]
source: [[Chapter 5.Pdf]]
source_pages:
- 28
- 29
mode: ENGINEER

---

# Definition & Mechanics
The **register storage class** is a type of storage class in C++ that suggests to the compiler that a variable should be stored in a CPU register for faster access. 
* **Key characteristics:**
  + Variables are created and destroyed when the block is entered and exited.
  + The compiler decides whether to honor the `register` request.
  + Typically used for loop counters and frequently accessed variables.

# Worked Example
Domain: Aerospace engineering

Suppose we want to optimize a loop that calculates the trajectory of a spacecraft. We can use the `register` storage class for the loop counter.

cpp
void calculate_trajectory() {
    register int i;
    for (i = 0; i < 1000; i++) {
        // calculate trajectory
    }
}
```text