---
title: Call_By_Reference
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Function_Concepts]]
source: [[Chapter 5.Pdf]]
source_pages:
- 40
- 41
mode: ENGINEER

---

# Definition & Mechanics
**Call by Reference** is a parameter passing mechanism where the **address** of the actual argument is passed to the formal parameter. This allows the function to modify the original variable.

* The formal parameter is a **reference** (alias) to the actual argument.
* Changes made to the formal parameter affect the actual argument.
* The function receives a reference to the memory location of the actual argument.

# Worked Example
Domain: Film production

Suppose we have a function to update the `budget` and `shooting_location` of a movie.

cpp
void updateMovieInfo(int &budget, string &location) {
    budget += 100000;
    location = "New York";
}

int main() {
    int budget = 1000000;
    string location = "Los Angeles";
    cout << "Before update: budget = " << budget << ", location = " << location << endl;
    updateMovieInfo(budget, location);
    cout << "After update: budget = " << budget << ", location = " << location << endl;
    return 0;
}
```text

Output:
```
Before update: budget = 1000000, location = Los Angeles
After update: budget = 1100000, location = New York
```text