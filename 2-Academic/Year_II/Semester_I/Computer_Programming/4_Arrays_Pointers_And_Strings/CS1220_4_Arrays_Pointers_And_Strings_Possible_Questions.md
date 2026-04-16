---
title: CS1220_4_Arrays_Pointers_And_Strings_Possible_Questions
created_at: '2026-01-25T10:47:38Z'
last_modified: '2026-01-25T10:47:38Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 441c407f-2800-45cd-a0e0-1d129ae9f3ec
type: Questions
course: Computer_Programming
year: Year_II
semester: Semester_I
credits: 4
original_source: AI_Generated_From_Prompt
aliases: []
unit: 4_Arrays_Pointers_And_Strings
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[C++_Characters]]
### Level 1: Understanding (The Basics)
1.  **The Component Check:** What is the purpose of including the `ctype.h` header file in a C++ program when working with characters? Name two macros provided by this library for testing characters.
### Level 2: Competence (Application)
2.  **The Clean Build:** Write a C++ code snippet that prompts the user to enter a single character and then uses `ctype.h` macros to determine and print if the character is a digit or an uppercase letter.
### Level 3: Mastery (The Crucible)
3.  **The Broken System:** A junior developer wrote the following code to check if a character is a letter, a digit, or a whitespace. Identify the logical flaw in the sequence of `if-else if` statements that might lead to incorrect output for certain characters, and suggest a correction.
```cpp
    #include <iostream>
    #include <cctype>

    int main() {
        char ch = '7';
        if (isdigit(ch)) {
            std::cout << "It's a digit.\n";
        } else if (isalpha(ch)) {
            std::cout << "It's a letter.\n";
        } else if (isspace(ch)) {
            std::cout << "It's a whitespace.\n";
        } else {
            std::cout << "It's another character.\n";
        }
        return 0;
    }
```
```text
    // Scenario 1: Input '7'
    // Output: It's a digit.
    // Scenario 2: Input 'A'
    // Output: It's a letter.
    // Scenario 3: Input ' '
    // Output: It's a whitespace.
    // Scenario 4: Input '!'
    // Output: It's another character.
```

## [[Strings_in_C++]]
### Level 1: Understanding (The Basics)
4.  **The Fact Check:** Briefly define what a C++ string is and describe the fundamental difference in how C-style strings and `std::string` objects are internally represented regarding null termination.
### Level 2: Competence (Application)
5.  **The Sort:** Given a list of string literals and `std::string` variables, categorize them as either "C-style string" or "std::string" based on their typical declaration and properties: `"Hello World"`, `char name[15] = "Alice"`, `std::string city = "New York"`, `char* phrase = "Programming"`.
### Level 3: Mastery (The Crucible)
6.  **The Impostor:** "String literals are `std::string` objects." Identify if this statement is true or false. If false, explain why and describe the "gotcha difference" between a string literal and a `std::string` object that can sometimes lead to confusion.

## [[C_Style_String_Functions]]
### Level 1: Understanding (The Basics)
7.  **The Component Check:** Name two common C-style string manipulation functions found in the `<string.h>` header and briefly state their purpose.
### Level 2: Competence (Application)
8.  **The Clean Build:** Write a C++ code snippet using C-style string functions to concatenate the string "World" onto "Hello" and then copy the result into a new C-style string called `full_message`. Print `full_message`.
### Level 3: Mastery (The Crucible)
9.  **The Broken System:** A programmer is trying to concatenate `str2` onto `str1` using `strcat` but is encountering a buffer overflow. Analyze the provided code and explain why the buffer overflow occurs. Propose a safer alternative.
```cpp
    #include <iostream>
    #include <cstring> // For strcat

    int main() {
        char str1[] = "Hello"; // Changed to array to allow modification
        char str2[] = " World!";
        // The original problem assumed str1 was a pointer to a string literal, which cannot be modified.
        // Even with `char str1[]`, if its size is exactly "Hello" + '\0', it cannot accommodate " World!".
        // For demonstration, let's assume str1 has enough space or dynamically allocate.
        // Here, we'll demonstrate with a larger buffer for str1:
        char buffer = "Hello"; // Create a buffer with enough space
        char str_to_add[] = " World!";
        strcat(buffer, str_to_add);
        std::cout << buffer << std::endl;
        return 0;
    }
```
```text
    // Scenario 1: Original flawed code
    // Output: Program might crash or exhibit undefined behavior due to buffer overflow.
    // Explanation: strcat attempts to write " World!" (8 characters + null terminator) into str1,
    // which only has space for 5 characters + null terminator (total 6 characters already used by "Hello").
    // The remaining 4 bytes are insufficient.
    // Scenario 2: Corrected code with larger buffer (demonstrated above)
    // Output: Hello World!
```

## [[Standard_String_Class_Methods]]
### Level 1: Understanding (The Basics)
10. **The Component Check:** How would you obtain the length of an `std::string` object using one of its member methods? Provide a simple example.
### Level 2: Competence (Application)
11. **The Clean Build:** Write a C++ code snippet that declares two `std::string` objects, `s1 = "Programming"` and `s2 = " is fun"`. Use `std::string` methods to concatenate them, compare `s1` with `s2` lexicographically, and print the results of both operations.
### Level 3: Mastery (The Crucible)
12. **The Broken System:** A developer wants to check if two `std::string` objects, `text1` and `text2`, contain the same sequence of characters. They wrote `if (text1.compare(text2) == 0)`. While this works, identify another, more idiomatic and potentially clearer operator for this specific comparison in C++, and explain why it's often preferred.

## [[String_Input_and_Output]]
### Level 1: Understanding (The Basics)
13. **The Tool Check:** When using `cin >>` to read a string into a `char` array or `std::string`, what characters are typically used as delimiters or terminators?
### Level 2: Competence (Application)
14. **The Routine Run:** Outline the steps, including C++ code, to read a complete line of text (including spaces) from the user into an `std::string` variable.
### Level 3: Mastery (The Crucible)
15. **The Disaster Drill:** You are writing a program that reads a user's full name, which might include spaces. If you use `cin >> name;` (where `name` is an `std::string`), explain what happens if the user types "John Doe". What is the immediate recovery step to ensure the entire "John Doe" is captured?

## [[Arrays]]
### Level 1: Understanding (The Basics)
16. **The Neighbor Check:** In C++, what are the two fundamental properties of an array regarding the type of elements it can hold and how its size is managed after creation?
### Level 2: Competence (Application)
17. **The Sort:** Given a list of data structures, categorize them as either "Array" or "Not an Array" and provide a brief reason: `int numbers[10]`, `std::vector<int> dynamic_list`, `int single_value`, `char name[] = "Alice"`.
### Level 3: Mastery (The Crucible)
18. **The Impostor:** "An array is always a collection of heterogeneous data types." Identify if this statement is true or false. If false, explain why and describe the "gotcha difference" that makes arrays fundamentally different from, for example, a `struct` or `class` in this regard.

## [[Array_Declaration_and_Initialization]]
### Level 1: Understanding (The Basics)
19. **The Tool Check:** What is the basic syntax for declaring a one-dimensional array in C++ with a specified size and data type?
### Level 2: Competence (Application)
20. **The Routine Run:** Provide a C++ code snippet that declares an integer array named `scores` of size 5 and initializes it with the values 85, 90, 78, 92, and 88 using an initializer list.
### Level 3: Mastery (The Crucible)
21. **The Disaster Drill:** A developer declares an array `int data[5] = {1, 2, 3, 4, 5, 6};`. What is the immediate consequence of this declaration during compilation, and why does it occur?

## [[Array_Indexing_and_Access]]
### Level 1: Understanding (The Basics)
22. **The Component Check:** What is an array index (or subscript), and what is its range in a C++ array of size `N`?
### Level 2: Competence (Application)
23. **The Clean Build:** Write a C++ code snippet that declares an array of 4 floating-point numbers, assigns values to each element using direct indexing, and then prints the value of the third element.
### Level 3: Mastery (The Crucible)
24. **The Impossible Case:** An array `myArray` has 10 elements. A loop attempts to access `myArray[i]` where `i` ranges from `0` to `10`. What is the value of the index `i` that will cause an access violation, and why?

## [[Multidimensional_Arrays]]
### Level 1: Understanding (The Basics)
25. **The Component Check:** How are elements of a two-dimensional array referenced in C++? Provide an example for an array named `matrix`.
### Level 2: Competence (Application)
26. **The Clean Build:** Write a C++ code snippet to declare a 2D integer array `grid` with 3 rows and 4 columns, and initialize all elements to zero using nested curly braces.
### Level 3: Mastery (The Crucible)
27. **The Broken System:** A programmer declares `int threeD[2][3][4];` for a 3D array. If they intend to access the very last element of this array, they incorrectly use `threeD[2][3][4]`. Identify the correct index to access the last element and explain why the original attempt is wrong.

## [[Array_Traversal_and_Manipulation]]
### Level 1: Understanding (The Basics)
28. **The Component Check:** When traversing a 2D array, what are the two common orders of iteration (e.g., "by rows")?
### Level 2: Competence (Application)
29. **The Clean Build:** Write a C++ function `sum2DArray` that takes a 2D integer array (assume 3 rows, 3 columns) and its dimensions as input, and returns the sum of all its elements.
### Level 3: Mastery (The Crucible)
30. **The Broken System:** A function is supposed to find the maximum element in a 1D array `arr` of size `N`. Identify the flaw in the provided code snippet that would cause it to fail if the largest element is the first element, and suggest a correction.
```cpp
    int findMax(int arr[], int size) {
        int max_val = arr; // Potential flaw here
        for (int i = 1; i < size; i++) {
            if (arr[i] > max_val) {
                max_val = arr[i];
            }
        }
        return max_val;
    }
```
```text
    // Scenario 1: arr = {100, 50, 20}, size = 3
    // Expected Output: 100
    // Actual Output with flaw: 50 (incorrect, because max_val initializes to arr)
    // Scenario 2: arr = {10, 20, 5}, size = 3
    // Expected Output: 20
    // Actual Output with flaw: 20 (correct, but code is fragile)
```

## [[Off_by_One_Errors]]
### Level 1: Understanding (The Basics)
31. **The Element ID:** What is an "off-by-one error" in the context of array manipulation?
### Level 2: Competence (Application)
32. **The Flow Chart:** Describe a common scenario in array processing where an off-by-one error might occur (e.g., loop bounds), and illustrate with a simple example.
### Level 3: Mastery (The Crucible)
33. **The Friction Point:** A game developer is creating a character selection screen for 5 characters, indexed 0-4. They write a loop `for (int i = 1; i <= 5; ++i)` to display character portraits. Identify the friction point where this code will likely fail or cause unexpected behavior, and explain why.

## [[Index_Out_of_Range_Errors]]
### Level 1: Understanding (The Basics)
34. **The Warning Lights:** What is an "index out of range" error?
### Level 2: Competence (Application)
35. **The Disaster Drill:** If an array `data` has 7 elements (indices 0-6), and a program attempts to access `data[7]`, what is the typical outcome in C++?
### Level 3: Mastery (The Crucible)
36. **The Warning Lights:** A C++ program uses an array `char buffer[10];` and later executes `buffer[10] = 'X';`. Explain why the C++ compiler will *not* detect this as an error during compilation, but it remains a critical runtime issue. What is the potential consequence of this un-detected error?

## [[Pointers]]
### Level 1: Understanding (The Basics)
37. **The Variable ID:** What is a pointer in C++, and what kind of value does it store?
### Level 2: Competence (Application)
38. **The Trade-off:** Explain the difference between `&variable` and `*pointer_variable`. Provide a brief example for each.
### Level 3: Mastery (The Crucible)
39. **The Impostor:** "A pointer `p` and the memory address `&p` are the same thing." Is this statement true or false? If false, explain the crucial distinction between these two concepts.

## [[Void_Pointers]]
### Level 1: Understanding (The Basics)
40. **The Component Check:** What is a `void` pointer (`void*`), and what is its primary characteristic regarding the type of data it can point to?
### Level 2: Competence (Application)
41. **The Clean Build:** Write a C++ code snippet that declares an integer variable, a float variable, and a `void` pointer. Assign the address of both the integer and float variables to the `void` pointer sequentially, demonstrating its versatility.
### Level 3: Mastery (The Crucible)
42. **The Broken System:** A programmer has a `void* p` that currently holds the address of an `int` variable. They try to directly dereference it using `*p = 10;`. Explain why this code will result in a compilation error and what "immediate recovery step" (syntax change) is necessary to correctly assign a value to the integer through `p`.

## [[Pointer_Arithmetic]]
### Level 1: Understanding (The Basics)
43. **The Variable ID:** When you increment a pointer in C++ (e.g., `ptr++`), by how many bytes does the pointer's address value change?
### Level 2: Competence (Application)
44. **The Standard Solver:** Assume an integer pointer `p` points to memory address `1000`. If `sizeof(int)` is 4 bytes, what memory address will `p + 2` point to? Show your calculation.
### Level 3: Mastery (The Crucible)
45. **The Impossible Case:** Consider a `char` array `data[5] = {'A', 'B', 'C', 'D', 'E'};` and a `char* ptr = data;`. If you execute `ptr += 5;`, explain what memory location `ptr` now points to. Why would attempting to dereference `*ptr` after this operation be problematic, even though the arithmetic itself is valid?

## [[Const_Pointers_and_Pointers_to_Const_Types]]
### Level 1: Understanding (The Basics)
46. **The Fact Check:** Briefly explain the difference between a "pointer to a constant integer" (e.g., `const int* p`) and a "constant pointer to an integer" (e.g., `int* const p`).
### Level 2: Competence (Application)
47. **The Sort:** Given the declarations `const int x = 10; int y = 20;`, categorize the following pointer declarations as either "Valid" or "Invalid" for their intended purpose, and explain why:
    *   `int* ptr1 = &x;` (intended to change `x` through `ptr1`)
    *   `const int* ptr2 = &x;` (intended to read `x` through `ptr2`)
    *   `int* const ptr3 = &y;` (intended to always point to `y`)
    *   `const int* const ptr4 = &y;` (intended to read `y` through `ptr4` and not change `ptr4`'s target)
### Level 3: Mastery (The Crucible)
48. **The Impostor:** A developer encounters the declaration `const int* p;` and incorrectly assumes it means "a pointer `p` that cannot be changed." Explain the "gotcha difference" here and clarify what `const int* p;` actually restricts in terms of modification.

## [[Pointers_and_Arrays_Relationship]]
### Level 1: Understanding (The Basics)
49. **The Neighbor Check:** How is the name of a C++ array related to pointers?
### Level 2: Competence (Application)
50. **The Sort:** Given an array `int arr[5];`, show two different ways to access the third element (index 2): one using array indexing syntax and another using pointer arithmetic with the array name.
### Level 3: Mastery (The Crucible)
51. **The Impostor:** "An array name is an identical equivalent to a modifiable pointer." Is this statement true or false? If false, explain why a C++ array name cannot be reassigned like a regular pointer variable, even though it can be used in pointer arithmetic.

## [[Dynamic_Memory_Allocation]]
### Level 1: Understanding (The Basics)
52. **The Component Check:** What are the two primary operators in C++ used for dynamic memory allocation and deallocation?
### Level 2: Competence (Application)
53. **The Clean Build:** Write a C++ code snippet that dynamically allocates an array of 5 integers, initializes all elements to 0, and then deallocates the memory.
### Level 3: Mastery (The Crucible)
54. **The Broken System:** A C++ program uses `int* data = new int;` to allocate memory for a single integer. Later in the program, the developer attempts to free this memory using `delete[] data;`. Explain why using `delete[]` in this scenario is incorrect and what the correct deallocation operator should be.

# Part II: Unit Synthesis (The Final Boss)
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: Dynamic Student Database
**The Setup:** You are tasked with creating a simplified student database system in C++. You need to store the names (up to 20 characters each) and grades (integers) for a variable number of students. The exact number of students will be provided by the user at runtime. You decide to use dynamic arrays for this purpose.
**The Constraints:**
*   You must use **C-style strings** for student names.
*   You must use **dynamic memory allocation** for both names and grades.
*   Your solution must explicitly handle potential **index out of range errors** during data entry or display.
**The Challenge:**
(a) Design a C++ program that:
    (i) Prompts the user for the number of students.
    (ii) Dynamically allocates an array of C-style strings (for names) and an array of integers (for grades) to store student data.
    (iii) Uses `std::cin.getline()` for reading names to handle spaces.
    (iv) Prompts for and stores each student's name and grade.
    (v) Displays all student names and grades.
    (vi) Properly deallocates all dynamically allocated memory before the program exits.
(b) Explain how your program ensures memory safety given the constraints, specifically discussing how `new` and `delete` (or `new[]` and `delete[]`) are used correctly for the different data types.
(c) Predict the failure mode if you neglected to deallocate the memory for student names and grades, and the program ran for an extended period, adding and removing students without proper cleanup.