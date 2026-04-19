---
title: Function_Calls_And_Execution
type: Atomic Note
course: Database Systems
semester: Autumn 2025
unit: 3
hub: [[3_Relational_Model_And_Database_Design_Hub]]
parent: [[Modular_Programming]]
source: [[Chapter 5.Pdf]]
source_pages:
- 15
- 16
mode: ENGINEER

---

# Definition & Mechanics
A **function call** is a statement that invokes a function, passing control to the function's body. The function's execution is determined by its **definition**, which includes the function's **return type**, **parameters**, and **body**.

* **Function call**: a statement that invokes a function, e.g., `square(5)`.
* **Function definition**: the code that implements the function, including its return type, parameters, and body.
* **Return type**: the data type of the value returned by the function, e.g., `int`, `void`.
* **Parameters**: the inputs to the function, which can be **pass by value** or **pass by reference**.

# Worked Example
Domain: Aerospace

Suppose we have a function `calculate_trajectory` that calculates the trajectory of a spacecraft given its initial velocity and angle of launch.

python
def calculate_trajectory(velocity, angle):
    # calculate trajectory
    trajectory = []
    for t in range(10):
        x = velocity * t * math.cos(angle)
        y = velocity * t * math.sin(angle) - 0.5 * t**2
        trajectory.append((x, y))
    return trajectory
```text

Let's call this function with `velocity = 100` and `angle = 45`:

```python
trajectory = calculate_trajectory(100, 45)
for point in trajectory:
    print(point)
```

This will output the trajectory of the spacecraft:

```text
(0, 0)
(70.71067811865475, 70.71067811865475)
(141.4213562373095, 141.4213562373095)
(212.13203435596425, 212.13203435596425)
(282.842712474619, 282.842712474619)
(353.55339059327375, 353.55339059327375)
(424.2640687119285, 424.2640687119285)
(494.97474683058325, 494.97474683058325)
(565.685424949238, 565.685424949238)
(636.3961030678927, 636.3961030678927)
```

# Edge Case
> **Q:** What happens when a function calls itself recursively without a proper base case?
> **A:** The function will continue to call itself indefinitely until the program runs out of stack space, resulting in a **stack overflow error**. This highlights the importance of ensuring that recursive functions have a proper **base case** to terminate the recursion.

# Connections
- **Depends on:** [[Modular_Programming]] — Function calls are a fundamental aspect of modular programming.
- **Enables:** [[Function_Overloading]] — Understanding function calls and execution is essential for function overloading.