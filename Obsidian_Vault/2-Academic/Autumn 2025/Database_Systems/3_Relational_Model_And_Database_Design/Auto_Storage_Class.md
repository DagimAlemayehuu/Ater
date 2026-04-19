---
title: Auto_Storage_Class
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
The **auto storage class** is a default storage class in C++ that automatically allocates and deallocates memory for variables. 
* **Memory allocation**: memory is allocated when the block is active and deallocated when the block or function exits.
* **Scope**: local to the block or function.
* **Lifetime**: variables are created only when the block is active and disappear when the block or function exits.

# Worked Example
Domain: Banking

Suppose we have a function to calculate the interest for a savings account:

cpp
void calculateInterest() {
    auto float interestRate = 0.05;
    auto float principal = 1000.0;
    auto float interest = principal * interestRate;
    cout << "Interest: " << interest << endl;
}
```text