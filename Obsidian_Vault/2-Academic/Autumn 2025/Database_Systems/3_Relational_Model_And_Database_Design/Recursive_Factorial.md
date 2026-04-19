---
title: Recursive_Factorial
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Functions_In_C++]]
source: [[Chapter 5.Pdf]]
source_pages:
- 50
- 51
mode: ENGINEER

---

# Definition & Mechanics
A **recursive factorial function** is a function that calls itself to compute the factorial of a given integer. The factorial of a non-negative integer $n$, denoted by $n!$, is the product of all positive integers less than or equal to $n$.

* **Base case**: $0! = 1$ or $1! = 1$ (stops the recursion)
* **Recursive case**: $n! = n \times (n-1)!$ (function calls itself with $n-1$)
* **Key requirements**:
  + Base case: stops the recursion to prevent infinite calls
  + Recursive case: function calls itself with modified arguments, moving toward the base case

# Worked Example
Domain: Aerospace

Compute the factorial of $5$ using a recursive function.

cpp
unsigned long factorial(unsigned long n) {
  if (n <= 1) // base case
    return 1;
  else
    return n * factorial(n - 1); // recursive call
}

int main() {
  int num = 5;
  cout << "Factorial of " << num << " = " << factorial(num);
  return 0;
}
```text