---
title: Static_Storage_Class
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
- 30
mode: ENGINEER

---

# Definition & Mechanics
The **static storage class** in C++ is used for variables and functions that retain their values between function calls. 
* **Key properties:**
  + **Scope**: Local to the block or function where declared.
  + **Lifetime**: Exists throughout the program execution.
  + **Initialization**: Initialized only once.
  + **Value preservation**: Preserves its value between function calls.

# Worked Example
Domain: Banking system

Suppose we want to track the number of transactions performed on an account. We can use a static variable to maintain a count across function calls.

cpp
void performTransaction() {
  static int transactionCount = 0;
  transactionCount++;
  cout << "Transaction count: " << transactionCount << endl;
}

int main() {
  performTransaction(); // Output: Transaction count: 1
  performTransaction(); // Output: Transaction count: 2
  performTransaction(); // Output: Transaction count: 3
  return 0;
}
```text