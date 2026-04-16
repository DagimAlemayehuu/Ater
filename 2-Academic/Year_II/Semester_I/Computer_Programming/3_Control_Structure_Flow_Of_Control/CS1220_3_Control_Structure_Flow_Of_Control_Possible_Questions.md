---
title: CS1220_3_Control_Structure_Flow_Of_Control_Possible_Questions
created_at: '2025-12-10T12:58:11Z'
last_modified: '2025-12-10T13:01:56Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 2b0b4e42-7402-48f3-9d0b-fb8e24b491a3
type: Questions
course: Computer_Programming
year: Year_II
semester: Semester_I
credits: 4
original_source: AI_Generated_From_Prompt
aliases: []
unit: 3_Control_Structure_Flow_Of_Control
ai_refinement_log: '2025-12-10T13:01:56Z: AI updated note (generic).'
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[Branching_Statements]]
### Level 1: Understanding (The Basics)
1.  **The Component Check:** What is the primary purpose of branching statements in C++ programming, and name two common branching constructs?

### Level 2: Competence (Application)
2.  **The Clean Build:** Write a C++ code snippet that uses an `if-else` structure to determine if a given integer `num` is divisible by both 3 and 5. If it is, print "Divisible by both"; otherwise, print "Not divisible by both".

### Level 3: Mastery (The Crucible)
3.  **The Broken System:** Consider a simple C++ program that attempts to categorise a user's age. The developer mistakenly wrote `if (age = 18)` instead of `if (age == 18)`. Explain why this mistake is a logical flaw, what the program will actually do when `age` is assigned `18`, and how it violates the intended control flow.

## [[If_Else_Statement]]
### Level 1: Understanding (The Basics)
4.  **The Component Check:** Describe the fundamental flow of control within an `if-else` statement.

### Level 2: Competence (Application)
5.  **The Clean Build:** A small online shop offers a 10% discount if the total purchase amount exceeds $150. Write a C++ code block that calculates the `finalPrice` given an `originalPrice`.

### Level 3: Mastery (The Crucible)
6.  **The Broken System:** Analyze the following C++ code snippet. The goal was to check if a user's input `temperature` is below freezing (0 degrees Celsius). Identify the mistake in the `if` condition and explain the unexpected behavior that would occur if the `temperature` variable was initialized to `-5`.

```cpp
    #include <iostream>
    int main() {
        int temperature = -5;
        if (temperature < 0); { // Mistake here
            std::cout << "It's freezing outside!" << std::endl;
        } else {
            std::cout << "Temperature is above freezing." << std::endl;
        }
        return 0;
    }
```
```text
    // Expected output for temperature = -5:
    // It's freezing outside!

    // Actual output for temperature = -5 with the mistake:
    // (Please describe what happens based on your analysis)
```

## [[Compound_Block_Statements]]
### Level 1: Understanding (The Basics)
7.  **The Component Check:** What is a compound statement in C++, and when is it necessary to use one?

### Level 2: Competence (Application)
8.  **The Clean Build:** Write an `if-else` statement where both the `if` and `else` branches execute more than one statement, utilizing compound statements correctly. The `if` branch should print "Access Granted" and then "Welcome User", while the `else` branch prints "Access Denied" and then "Please check credentials".

### Level 3: Mastery (The Crucible)
9.  **The Broken System:** A developer intended to update a `balance` and print a confirmation message only if a `transactionAmount` was positive. Identify why the following code will always print "Transaction processed." even if `transactionAmount` is negative, and how to fix it.

```cpp
    #include <iostream>
    int main() {
        double balance = 100.0;
        double transactionAmount = -50.0;
        if (transactionAmount > 0)
            balance += transactionAmount;
            std::cout << "Transaction processed." << std::endl; // This line is problematic
        return 0;
    }
```
```text
    // Expected output for transactionAmount = -50.0:
    // (Nothing related to transaction processing)

    // Actual output for transactionAmount = -50.0 with the mistake:
    // Transaction processed.
```

## [[Assignment_vs_Equality_Operators]]
### Level 1: Understanding (The Basics)
10. **The Variable ID:** Explain the distinct functional difference between the `=` (assignment) and `==` (equality) operators in C++.

### Level 2: Competence (Application)
11. **The Clean Build:** Write a C++ `if` statement that correctly checks if a variable `current_status` is exactly equal to the string `"Active"`. Provide an example output for both true and false cases.

### Level 3: Mastery (The Crucible)
12. **The Broken System:** A C++ function is designed to only allow an operation if a `user_id` matches a `privileged_id`. The developer wrote `if (user_id = privileged_id)` instead of `if (user_id == privileged_id)`. Explain how this bug could lead to a security vulnerability where any user could gain privileged access, regardless of their actual ID, and why it happens.

## [[Optional_Else_Clause]]
### Level 1: Understanding (The Basics)
13. **The Component Check:** When is it appropriate to use an `if` statement without an accompanying `else` clause?

### Level 2: Competence (Application)
14. **The Clean Build:** A program calculates a `bonus` only if `sales_target` is met. Write a C++ `if` statement that awards a `bonus` of 500 if `sales` are greater than or equal to `sales_target` (e.g., 1000). If the target is not met, no `bonus` is awarded, and the `if` statement should do nothing in that scenario. Afterwards, print the total `salary` (initial salary + bonus).

### Level 3: Mastery (The Crucible)
15. **The Broken System:** A system checks if an `emergency_flag` is set to `true`. If it is, it should activate a siren and then print a status message. However, the siren should *only* activate if the flag is true. The status message should *always* print. The developer wrote:

```cpp
    #include <iostream>
    int main() {
        bool emergency_flag = false;
        if (emergency_flag)
            std::cout << "Siren activating!" << std::endl;
            std::cout << "System status: Operational." << std::endl;
        return 0;
    }
```
```text
    // Expected output for emergency_flag = false:
    // System status: Operational.

    // Actual output for emergency_flag = false with the mistake:
    // (Please describe what happens based on your analysis)
```

## [[Nested_If_Else_Statements]]
### Level 1: Understanding (The Basics)
16. **The Component Check:** Define what a nested `if-else` statement is and provide a simple real-world analogy.

### Level 2: Competence (Application)
17. **The Clean Build:** Write a C++ program that determines if a student passes a course based on two conditions: a `midterm_score` (out of 100) and a `final_score` (out of 100). The student passes if both scores are 60 or above. If they fail either, print "Failed Course". If they pass both, print "Passed Course". Use nested `if-else` statements.

### Level 3: Mastery (The Crucible)
18. **The Broken System:** A traffic light system needs to decide if a car can proceed. It has a `light_is_green` boolean and a `sensor_detects_pedestrian` boolean. The rule is: if the light is green AND no pedestrian is detected, the car can proceed. Otherwise, it must wait. The developer wrote:

```cpp
    #include <iostream>
    int main() {
        bool light_is_green = true;
        bool sensor_detects_pedestrian = true;

        if (light_is_green) {
            if (sensor_detects_pedestrian) {
                std::cout << "Car must wait." << std::endl;
            } else {
                std::cout << "Car can proceed." << std::endl;
            }
        } else {
            std::cout << "Car must wait." << std::endl;
        }
        return 0;
    }
```
```text
    // Scenario 1: light_is_green = true, sensor_detects_pedestrian = false
    // Expected output: Car can proceed.
    // Actual output: (Analyze code for this scenario)

    // Scenario 2: light_is_green = true, sensor_detects_pedestrian = true
    // Expected output: Car must wait.
    // Actual output: (Analyze code for this scenario)

    // Scenario 3: light_is_green = false, sensor_detects_pedestrian = false
    // Expected output: Car must wait.
    // Actual output: (Analyze code for this scenario)
```
    Analyze the logic for the three scenarios and identify if the current code correctly implements the rule "if the light is green AND no pedestrian is detected, the car can proceed". If not, explain why and how to fix it.

## [[Multiway_If_Else_Statements]]
### Level 1: Understanding (The Basics)
19. **The Component Check:** Describe the primary benefit of using a multiway `if-else` (or `if-else if` ladder) over deeply nested `if` statements for handling multiple mutually exclusive conditions.

### Level 2: Competence (Application)
20. **The Clean Build:** Write a C++ function `getSeason(int month)` that returns a string representing the season based on the month number (1-12). Use a multiway `if-else` statement: 12, 1, 2 = "Winter"; 3, 4, 5 = "Spring"; 6, 7, 8 = "Summer"; 9, 10, 11 = "Autumn". Handle invalid month inputs.

### Level 3: Mastery (The Crucible)
21. **The Broken System:** A program uses a multiway `if-else` structure to assign a user role based on an `access_level` integer:
    - `access_level >= 90`: Administrator
    - `access_level >= 70`: Editor
    - `access_level >= 50`: Contributor
    - `access_level < 50`: Viewer

    If the conditions are implemented in the order `if (level >= 50) { ... } else if (level >= 70) { ... }`, explain why a user with `access_level = 80` would incorrectly be assigned "Contributor" instead of "Editor". How should the conditions be ordered to ensure correct assignment?

## [[Conditional_Operator]]
### Level 1: Understanding (The Basics)
22. **The Variable ID:** What is the conditional operator (ternary operator) in C++, and what is its basic syntax?

### Level 2: Competence (Application)
23. **The Clean Build:** Use the conditional operator to assign the `largerValue` between two integers, `val1` (e.g., 25) and `val2` (e.g., 18). Print the `largerValue`.

### Level 3: Mastery (The Crucible)
24. **The Impossible Case:** The conditional operator is often referred to as a "shorthand `if-else`". While true for expression-based assignments, it has limitations. Describe a scenario where you *cannot* replace a standard `if-else` statement with a conditional operator, even if the `if-else` only has two branches, and explain why.

## [[Switch_Statement]]
### Level 1: Understanding (The Basics)
25. **The Component Check:** What is the primary purpose of a `switch` statement in C++, and what type of expression is typically used as its controlling expression?

### Level 2: Competence (Application)
26. **The Clean Build:** Write a `switch` statement that takes an integer `dayOfWeek` (1-7) and prints the corresponding day name (e.g., 1 for "Monday", 7 for "Sunday"). Include a `default` case for invalid inputs.

### Level 3: Mastery (The Crucible)
27. **The Broken System:** A menu-driven program uses a `switch` statement to handle user choices (1 for "Save", 2 for "Load", 3 for "Exit"). If the developer forgets to include `break` statements after each `case`, describe the unexpected behavior that would occur if the user selects option 1 ("Save"). Explain why this happens, referring to the "fall-through" mechanism.

## [[Break_Statement]]
### Level 1: Understanding (The Basics)
28. **The Component Check:** What is the immediate effect of a `break` statement when encountered inside a `switch` statement or a loop?

### Level 2: Competence (Application)
29. **The Clean Build:** Modify the `switch` statement from the previous question (Q26) to include `break` statements, ensuring that only the selected day name is printed.

### Level 3: Mastery (The Crucible)
30. **The Impossible Case:** While `break` is useful in `switch` statements and loops, it cannot directly terminate an outer loop from within an inner loop without additional logic. Describe a scenario where a `break` in an inner loop would *not* stop the entire nested loop structure, and suggest how one might achieve complete termination in such a case.

## [[Loop_Statements]]
### Level 1: Understanding (The Basics)
31. **The Component Check:** What is the fundamental purpose of loop statements in C++ programming? Name the three primary types of loops available.

### Level 2: Competence (Application)
32. **The Clean Build:** Write a simple `for` loop that prints numbers from 1 to 5.

### Level 3: Mastery (The Crucible)
33. **The Broken System:** A junior developer wrote a program that was supposed to count down from 10 to 1, but it runs indefinitely. Identify the potential logical flaw in the loop's condition or update expression that would lead to an infinite loop, without needing to see the specific code.

## [[While_Loop]]
### Level 1: Understanding (The Basics)
34. **The Component Check:** Describe the execution flow of a `while` loop, specifically highlighting when its condition is evaluated.

### Level 2: Competence (Application)
35. **The Clean Build:** Write a C++ `while` loop that calculates the sum of all integers from 1 to 100. Print the final sum.

### Level 3: Mastery (The Crucible)
36. **The Broken System:** A program is designed to repeatedly ask for user input until a positive number is entered. The developer used a `while` loop, but the prompt for input appears only once, even if the user enters negative numbers multiple times. Explain what typical mistake in a `while` loop's structure would cause this, and how to correct it so the prompt is displayed for every invalid input.

## [[Do_While_Loop]]
### Level 1: Understanding (The Basics)
37. **The Component Check:** What is the key difference in execution between a `do-while` loop and a `while` loop?

### Level 2: Competence (Application)
38. **The Clean Build:** Write a C++ `do-while` loop that asks the user to enter a password. The loop should continue to prompt for the password until the correct password (e.g., "secret") is entered. Ensure the prompt appears at least once.

### Level 3: Mastery (The Crucible)
39. **The Impossible Case:** Describe a scenario where using a `do-while` loop would be an inappropriate choice, and a `while` loop or `for` loop would be significantly better, even if the loop body might execute zero times. Explain why `do-while` is unsuitable in that specific context.

## [[Loop_Pitfalls]]
### Level 1: Understanding (The Basics)
40. **The Variable ID:** Identify two common pitfalls or errors developers often encounter when working with loops in C++.

### Level 2: Competence (Application)
41. **The Clean Build:** Write a C++ `for` loop that correctly iterates from 0 to 4 (inclusive) and prints each number. Then, write a version of the same loop that *intentionally* includes a common pitfall (e.g., an infinite loop or off-by-one error) and briefly explain why it's a pitfall.

### Level 3: Mastery (The Crucible)
42. **The Broken System:** A game loop is implemented using a `while` statement: `while (gameRunning) ; { /* game logic */ }`. Explain why the semicolon after the `while` condition leads to an infinite loop without executing any game logic, assuming `gameRunning` remains true. How should it be corrected?

## [[For_Loop]]
### Level 1: Understanding (The Basics)
43. **The Component Check:** What are the three main components typically found within the parentheses of a `for` loop's definition, and what is the role of each?

### Level 2: Competence (Application)
44. **The Clean Build:** Write a C++ `for` loop that iterates backward from 10 down to 1, printing each number.

### Level 3: Mastery (The Crucible)
45. **The Broken System:** A developer wants to display a list of product IDs from `product_ids` array, skipping the first element (at index 0). They wrote: `for (int i = 0; i < num_products; i++) { if (i == 0) continue; std::cout << product_ids[i] << std::endl; }`. Explain why this code is inefficient for its stated purpose, even if it produces the correct output. Propose a more efficient `for` loop structure to achieve the same result.

## [[Continue_Statement]]
### Level 1: Understanding (The Basics)
46. **The Component Check:** What is the immediate effect of a `continue` statement when encountered inside a loop?

### Level 2: Competence (Application)
47. **The Clean Build:** Write a C++ `for` loop that iterates from 1 to 10. Use a `continue` statement to skip printing the number 5. All other numbers should be printed.

### Level 3: Mastery (The Crucible)
48. **The Impossible Case:** While `continue` skips the rest of the current iteration, it does not prevent the loop's update expression from executing (e.g., `i++` in a `for` loop). Describe a scenario where using `continue` without careful consideration in a `while` or `do-while` loop could lead to an infinite loop, even if the loop's condition would eventually become false under normal circumstances.

## [[Nested_Loops]]
### Level 1: Understanding (The Basics)
49. **The Component Check:** Define nested loops and provide a practical scenario where they are commonly used.

### Level 2: Competence (Application)
50. **The Clean Build:** Write a C++ program using nested `for` loops to print a 3x3 square of asterisks (`*`). Each row should be on a new line.

### Level 3: Mastery (The Crucible)
51. **The Broken System:** A programmer wants to generate a multiplication table up to 5x5. They wrote the following, but the output for the inner loop is incorrect, showing `1x1=1 1x2=2 2x1=2 2x2=4` instead of a proper table format. Identify the missing crucial element in the inner loop's output formatting that causes the incorrect appearance.

```cpp
    #include <iostream>
    int main() {
        for (int i = 1; i <= 3; ++i) {
            for (int j = 1; j <= 3; ++j) {
                std::cout << i << "x" << j << "=" << (i * j) << " ";
            }
        }
        return 0;
    }
```
```text
    // Expected output (partial, showing structure):
    // 1x1=1 1x2=2 1x3=3
    // 2x1=2 2x2=4 2x3=6
    // 3x1=3 3x2=6 3x3=9

    // Actual output with the mistake:
    // 1x1=1 1x2=2 1x3=3 2x1=2 2x2=4 2x3=6 3x1=3 3x2=6 3x3=9
```

# Part II: Unit Synthesis (The Final Boss)
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: Automated Grade Calculator
**The Setup:** You are developing a simplified automated grade calculator for a small course. The program needs to process grades for an unknown number of students. For each student, you will collect a numerical `score` (0-100). The program should categorize each student's grade (A, B, C, D, F) and then calculate the overall average score for all students.
**The Constraints:**
*   Input for `score` can be from -10 to 110.
*   The program should stop accepting student scores when the user enters -1.
*   Invalid scores (less than 0 or greater than 100) should be reported, but not included in the average calculation, and the program should prompt the user again for a valid score for that student.
*   Use a `switch` statement for grade categorization.
*   Use a loop to handle multiple student inputs.
*   Use `continue` to skip invalid score processing.
*   Ensure that the overall average calculation correctly handles the case where no valid scores are entered.

**The Challenge:**
(a) Design a C++ program structure that fulfills all the requirements, clearly showing where each control structure (loop, `if-else`, `switch`, `continue`) would be used.
(b) Explain the trade-off you made between using a `while` loop versus a `do-while` loop for collecting student scores, justifying your choice.
(c) Predict a potential pitfall if you accidentally used the assignment operator (`=`) instead of the equality operator (`==`) in a critical conditional check within your program.