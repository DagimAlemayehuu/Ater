---
title: Static Cast
type: Atomic Note
course: Computer Programming
semester: Autumn 2025
unit: '5'
hub: "[[5_Modular_Programming_Hub]]"
source: "[[Chapter 2.Pdf]]"
source_pages: []
mode: CS-CODE
read: false
generated: true
prerequisites:
- "[[Type Conversion]]"
---

# 1. Technical Definition
The `static_cast` operator in C++ is a type casting operator that performs a compile-time cast, which is used to convert the type of an expression to a specified type, allowing the programmer to explicitly specify the type conversion. The `static_cast` operator is used to perform conversions between types that are related by inheritance or that are similar in nature, such as between a base class and a derived class.

# 2. Mental Model
Imagine you have a toy box where you keep different types of toys, like blocks and dolls. A `static_cast` is like telling someone that the toy in the box is actually a block, even if it looks like a doll. You're making a decision about what type of toy it is, and if you're wrong, it might not work right. But if you're right, it works perfectly.

# 3. Syntax Mechanics
* The `static_cast` operator is used with the following syntax: `static_cast<new_type>(expression)`.
* It can be used to cast between related types, such as a base class and a derived class.
* It can also be used to cast between similar types, such as between numeric types.
* The cast is performed at compile-time, which means the compiler checks if the cast is valid.

# 4. Memory Lifecycle
* The `static_cast` operator does not change the memory layout of the object being cast.
* It does not perform any runtime checks, which means it does not throw an exception if the cast is invalid.
* The cast is only checked at compile-time, which means if the cast is invalid, the program will not compile.
* The `static_cast` operator does not affect the lifetime of the object being cast, it simply changes its type.

---

## 5. Worked Example

Error

---

## 6. Socratic Probes

**Scenario-Based Question**: Error

**Implementation Challenge**: Error

**Debug Challenge**: Error generating artifact.

---

### Answer Key
Error