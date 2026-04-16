---
title: CS1220_5_Modular_Programming_Possible_Questions
created_at: '2026-01-25T11:00:19Z'
last_modified: '2026-01-25T11:00:19Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: d4cdbdfc-f7bd-4250-9724-2b5f4da0ca8f
type: Questions
course: Computer_Programming
year: Year_II
semester: Semester_I
credits: 4
original_source: Lecture_5_-_Modular_Programming
aliases: []
unit: 5_Modular_Programming
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[Modular_Programming]]
### Level 1: Understanding (The Basics)
1.  **The Neighbor Check:** List three benefits of using modular programming in a large software project.
### Level 2: Competence (Application)
2.  **The Sort:** Given a program with 1000 lines of code, describe how you would apply modular programming principles to refactor it, outlining the steps you would take to identify potential modules.
### Level 3: Mastery (The Crucible)
3.  **The Impostor:** Explain why simply dividing a large program file into multiple smaller files without considering functional cohesion does *not* constitute true modular programming, using distinctions between modularity and mere file separation.

## [[Functions_C++]]
### Level 1: Understanding (The Basics)
4.  **The Component Check:** Define what a function is in C++ and identify its two main types.
### Level 2: Competence (Application)
5.  **The Clean Build:** Write a C++ function `calculateProduct` that takes two integers as arguments and returns their product.
### Level 3: Mastery (The Crucible)
6.  **The Broken System:** You are given a C++ program where a `main` function is trying to call `void myFunction(int x)` defined later in the file, but it's getting a "function not declared" error. Explain the flaw and propose two different fixes.

## [[Function_Prototypes]]
### Level 1: Understanding (The Basics)
7.  **The Component Check:** What is the primary purpose of a function prototype in C++?
### Level 2: Competence (Application)
8.  **The Clean Build:** Provide the function prototype for a function named `computeAverage` that takes three `double` values and returns a `double`.
### Level 3: Mastery (The Crucible)
9.  **The Broken System:** A developer defines a function `void processData(int value)` but provides a prototype `void processData(float data)`. Explain what kind of error this will cause and why, referring to the compiler's role.

## [[Function_Definition]]
### Level 1: Understanding (The Basics)
10. **The Component Check:** What two main parts constitute a function definition?
### Level 2: Competence (Application)
11. **The Clean Build:** Write the full definition for the `computeAverage` function prototyped in the previous question (taking three `double` values and returning a `double` average).
### Level 3: Mastery (The Crucible)
12. **The Broken System:** A C++ programmer is attempting to define a function `int innerFunc() { return 10; }` inside another function `void outerFunc() { ... }`. Explain why this is not allowed in C++ and its implications.

## [[Return_Statement_C++]]
### Level 1: Understanding (The Basics)
13. **The Component Check:** What is the `return` keyword used for in C++ functions?
### Level 2: Competence (Application)
14. **The Clean Build:** Write a C++ function `checkEligibility(int age)` that returns `true` if `age` is 18 or greater, and `false` otherwise.
### Level 3: Mastery (The Crucible)
15. **The Broken System:** Consider a function `int processStatus(int code)` that's supposed to return `0` for success, or a negative integer for different error codes. A specific error case `if (code == -1)` has a `return -1;` statement, but the function also contains complex logic afterward. Explain how the early `return` impacts the function's flow and why it's a useful pattern in such scenarios.

## [[Function_Call_and_Execution]]
### Level 1: Understanding (The Basics)
16. **The Follow the Ball:** Describe the sequence of events that occur when a `main` function makes a call to another function, say `calculateSum()`.
### Level 2: Competence (Application)
17. **The Transformation:** If function `A` calls function `B`, and function `B` calls function `C`, trace the order in which these functions will complete their execution and return control.
### Level 3: Mastery (The Crucible)
18. **The Reality Check:** You're debugging a program where a function call `result = calculateValue(input);` seems to hang indefinitely. What might be the underlying problem related to function execution flow that causes this, and what is a common programming error that leads to this?

## [[Scope_of_Identifiers]]
### Level 1: Understanding (The Basics)
19. **The Where Does it Live?:** Differentiate between `local` and `global` identifiers in C++.
### Level 2: Competence (Application)
20. **The Who are the Neighbors?:** Given a C++ program with a global variable `int count = 0;` and a function `void increment() { int count = 10; count++; }`, what will be the value of the global `count` after calling `increment()`? Explain why.
### Level 3: Mastery (The Crucible)
21. **The Impostor:** You have a deeply nested function call chain. A variable `temp` is declared in the outermost function, and another `temp` is declared in an innermost function. Explain how the compiler resolves which `temp` is being accessed at different points, particularly how local scope protects the innermost `temp`.

## [[Scope_Resolution_Operator_C++]]
### Level 1: Understanding (The Basics)
22. **The Component Check:** What is the primary purpose of the unary scope resolution operator (`::`) in C++?
### Level 2: Competence (Application)
23. **The Clean Build:** Write a C++ code snippet that demonstrates how to access a global variable `int value = 50;` from within a `main` function where a local variable `int value = 10;` is also declared.
### Level 3: Mastery (The Crucible)
24. **The Broken System:** A C++ program has a global variable `double PI = 3.14;` and a local variable `PI` inside a function that needs to use the *global* `PI` for a specific calculation. If the local `PI` is used accidentally, explain the potential error and how `::PI` would prevent it.

## [[Parameter_Passing_Mechanisms]]
### Level 1: Understanding (The Basics)
25. **The Spot the Impostor:** What are the two main mechanisms for passing parameters to functions in C++?
### Level 2: Competence (Application)
26. **The Kill Sheet:** Create a comparison table highlighting three key differences between `call by value` and `call by reference` in C++.
### Level 3: Mastery (The Crucible)
27. **The Impostor Test:** Describe a scenario where a programmer *intends* to modify an argument within a function but uses the wrong parameter passing mechanism, leading to unexpected results. Explain the mechanism used, the intended outcome, and the actual outcome.

## [[Call_by_Value]]
### Level 1: Understanding (The Basics)
28. **The Follow the Ball:** When an argument is passed `by value` to a function, what does the function receive?
### Level 2: Competence (Application)
29. **The Transformation:** Trace the value of a variable `int x = 5;` when passed `by value` to a function `void modify(int val) { val = 10; }`. What is the value of `x` after the function call?
### Level 3: Mastery (The Crucible)
30. **The Reality Check:** You have a function that takes a large `struct` or `class` object `by value`. Explain why this might be inefficient in terms of memory and performance, and suggest an alternative if the function doesn't need to modify the original object.

## [[Call_by_Reference]]
### Level 1: Understanding (The Basics)
31. **The Follow the Ball:** When an argument is passed `by reference` to a function, what does the function receive?
### Level 2: Competence (Application)
32. **The Transformation:** Trace the value of a variable `int y = 5;` when passed `by reference` to a function `void modify(int &val) { val = 10; }`. What is the value of `y` after the function call?
### Level 3: Mastery (The Crucible)
33. **The Reality Check:** Consider a function `void swap(int &a, int &b)` designed to exchange the values of two integer variables. Explain why passing `by reference` is critical for this function to work correctly, as opposed to `call by value`.

## [[Recursion_Concepts]]
### Level 1: Understanding (The Basics)
34. **The Variable ID:** What are the two essential components of any recursive function?
### Level 2: Competence (Application)
35. **The Standard Solver:** Write a C++ recursive function to calculate the Nth Fibonacci number (where `Fib(0)=0, Fib(1)=1, Fib(n)=Fib(n-1)+Fib(n-2)`).
### Level 3: Mastery (The Crucible)
36. **The Impossible Case:** A recursive function is designed to sum integers from 1 to N, but it's missing its base case. Describe what will happen when this function is called with a positive integer N, and how the absence of a base case leads to an unrecoverable error.

## [[Function_Overloading_C++]]
### Level 1: Understanding (The Basics)
37. **The Spot the Impostor:** Define function overloading in C++.
### Level 2: Competence (Application)
38. **The Kill Sheet:** Create a comparison table for the following function declarations, indicating whether they represent valid overloading and explaining why: `int func(int a)`, `float func(int a)`, `int func(int a, float b)`, `int func(float a, int b)`.
### Level 3: Mastery (The Crucible)
39. **The Impostor Test:** A C++ program has two functions: `void process(int x)` and `void process(double y)`. If `process(5)` is called, which function will be invoked? If `process(5.5)` is called, explain why this might lead to ambiguous overloading in certain C++ versions or with specific compiler settings.

## [[Inline_Functions_C++]]
### Level 1: Understanding (The Basics)
40. **The Traffic Jam:** What is the primary advantage of using an `inline` function?
### Level 2: Competence (Application)
41. **The Backpack Rule:** Explain the trade-off between increased executable file size and reduced function call overhead when a function is inlined.
### Level 3: Mastery (The Crucible)
42. **The Benchmark:** Under what circumstances would the C++ compiler likely *ignore* the `inline` keyword, and why would it make that decision, even if the programmer requested inlining?

## [[Storage_Classes_C++]]
### Level 1: Understanding (The Basics)
43. **The Component Check:** Name the four storage classes in C++.
### Level 2: Competence (Application)
44. **The How the Parts Talk to Each Other:** For the `static` storage class, describe its lifetime and scope.
### Level 3: Mastery (The Crucible)
45. **The Broken System:** You are working on a C++ program with a function `void logCount() { static int call_count = 0; call_count++; }`. If `logCount()` is called multiple times, what will be the value of `call_count` on the third call? How would this differ if `call_count` were an `auto` variable?

## [[Static_and_Automatic_Variables]]
### Level 1: Understanding (The Basics)
46. **The Spot the Impostor:** What is the key difference in lifetime between `static` and `automatic` variables?
### Level 2: Competence (Application)
47. **The Kill Sheet:** Create a comparison table outlining the differences in scope, lifetime, and initialization for `static` vs. `automatic` variables.
### Level 3: Mastery (The Crucible)
48. **The Impostor Test:** A function needs to count how many times it has been called. A junior developer attempts this by declaring an `int counter = 0;` at the beginning of the function body. Explain why this approach fails and how changing `counter` to a `static` variable resolves the issue.

## [[Default_Parameters_C++]]
### Level 1: Understanding (The Basics)
49. **The Component Check:** When can you assign a `default value` to a function parameter in C++?
### Level 2: Competence (Application)
50. **The How the Parts Talk to Each Other:** Write a C++ function prototype for `printMessage(string msg, int times = 1)` that displays a given message a specified number of times, defaulting to once.
### Level 3: Mastery (The Crucible)
51. **The Broken System:** A function is declared as `void calculate(int a = 1, int b, int c = 3)`. Explain why this function declaration is syntactically incorrect according to C++ rules for default parameters.

# Part II: Unit Synthesis (The Final Boss)
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: Designing a Modular Gradebook System
**The Setup:** You are tasked with designing a modular C++ program for a simplified gradebook system. The system needs to:
*   Read student scores from user input.
*   Calculate the average score for a student.
*   Assign a letter grade based on the average.
*   Store student data for multiple students.
**The Constraints:**
*   You cannot use any global variables for student scores.
*   All input/output operations for scores must be handled by a dedicated function.
*   The system must be able to swap two student's records by modifying their data directly within a function.
*   The letter grade assignment should handle an edge case where a score is below 0 or above 100.
**The Challenge:**
(a) Design the function prototypes for at least three functions: one for input, one for calculating average and assigning grade (which should *not* directly print the grade, but return it), and one for swapping student records. Justify your parameter passing choices for each.
(b) For the `assignGrade` function, describe how you would use `return` statements to handle the invalid score edge case (below 0 or above 100) without crashing the program, perhaps by returning a special error value or status.
(c) If you decide to use recursion for calculating a sum of an arbitrary list of numbers (not scores) elsewhere in your gradebook program, outline the base case and recursive step for such a function.
(d) Consider a scenario where you have multiple `calculateAverage` functions (e.g., for different types of scores). Explain how function overloading would be used here, and provide two distinct function prototypes that would be valid overloaded versions.