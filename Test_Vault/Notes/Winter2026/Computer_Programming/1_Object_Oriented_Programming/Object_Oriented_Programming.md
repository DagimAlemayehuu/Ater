---
title: Object_Oriented_Programming
course: Computer Programming
unit: '1'
semester: Winter2026
mode: CS-SOFTWARE
type: atomic_note
hub: "[[1_Object_Oriented_Programming_Hub]]"
source: "[[Inbox/Generated/Winter2026/Computer_Programming/Chapter_one.pdf]]"
date: '2026-05-18'
prerequisites:
- "[[Programming_Paradigms]]"
source_pages:
- 5
generated: true
read: false
---

## Mental Model

In a large pharmaceutical company's research lab, scientists work on different projects by creating specialized teams (objects) that consist of experts from various departments, each with their own specific role and skills. Just as these teams can be assembled and reused across multiple projects, with each team member (attribute) contributing to the project's goals and interacting with others in a controlled way, object-oriented programming enables developers to create reusable code modules (objects) that interact and collaborate to solve complex problems. When a scientist needs to modify a team's composition or a team member's role, they only need to update that specific team or member, without affecting other projects or teams, much like how changes to a class or object do not impact the rest of the program.

## The Logic Behind the Code

[[Object_Oriented_Programming]] is a way of writing code that focuses on data and objects. 

To understand what Object Oriented Programming is, let's first look at how programming started. Programming began with binary code and mechanical switches. As computers got better, programmers started using high-level languages that had English-like instructions to make development easier. 

There were different approaches to programming, including [[Unstructured_Programming]] and Structured Programming. Unstructured Programming used goto statements, which led to "Spaghetti code" that was difficult to maintain. Structured Programming introduced functions, procedures, and subroutines, which made the code more readable and manageable. However, Structured Programming had limitations, such as making it hard to model real-world scenarios accurately and requiring updates across all functions when changing a data type.

The reason Object Oriented Programming was developed was to solve these problems. It shifts the focus from "How to do it" (functions) to "What it is" (data/objects). This approach allows for accurate real-world modeling, increased security, and code reuse.

In Object Oriented Programming, data and methods are combined into a single unit called a class. A class is like a blueprint or a template that defines the characteristics of an object. Multiple independent objects can be created from the same class and interact with each other. This leads to more robust and maintainable software systems.

For example, in a banking system, instead of just having functions for withdraw, deposit, and transfer, Object Oriented Programming would focus on creating objects like Customer and Money. This approach makes it easier to understand and model real-world scenarios.

By focusing on data and objects, Object Oriented Programming provides a way to write code that is more modular, maintainable, and efficient. This is the core idea behind Object Oriented Programming, which has become a fundamental concept in software development.

## The Technical Implementation

Object-Oriented Programming (OOP) is a programming paradigm that revolves around the concept of data and objects, providing a structured approach to software development. This paradigm emerged as a response to the limitations of earlier programming approaches, including unstructured and structured programming, which faced challenges such as code maintainability, debugging complexities, and the need for code reusability. By focusing on objects and data, OOP enables developers to create modular, reusable, and maintainable code, thereby addressing critical concerns such as avoiding duplicate efforts, controlling global variables, and facilitating effective maintenance of large code bases.

| **Concept** | **Description** | **Key Characteristics** |
| --- | --- | --- |
| [[Programming_Paradigms]] | Approaches to programming | Unstructured, Structured, Object-Oriented |
| [[Unstructured_Programming]] | Uses goto statements, leading to "Spaghetti code" | Difficult to maintain, Linear instruction flow |
| Structured Programming | Introduced functions, procedures, and subroutines | Focus on managing interactions, Local variables |
| Object-Oriented Programming | Focuses on data and objects | Reusability, [[Encapsulation]], [[Abstraction]] |
| [[Oop_Principles]] | Fundamental concepts of OOP | Not explicitly listed in source, but implied to be key to OOP |
| [[Java_Buzzwords]] | Key characteristics of Java | Not explicitly listed in source, but implied to be important for Java |
| [[Java_Technology]] & Editions | Various types of [[Java_Platforms]] | Not explicitly listed in source, but implied to be important for Java development |
| [[Java_Development_Tools]] | Basic tools and program types | Not explicitly listed in source, but implied to be important for Java development |


---

## The Proving Grounds

```interactive-quiz
[
  {
    "type": "mcq",
    "question": "In Object Oriented Programming, what is the primary focus of programming?",
    "options": {
      "A": "Procedures and functions",
      "B": "Data and objects",
      "C": "Algorithms and data structures",
      "D": "Hardware and software interactions"
    },
    "answer": "B",
    "explanation": "Object Oriented Programming is a way of writing code that focuses on data and objects, rather than procedures and functions.",
    "explanation_page": 5
  },
  {
    "type": "true_false",
    "question": "Object Oriented Programming is a programming paradigm that emphasizes the use of binary code and mechanical switches.",
    "answer": false,
    "explanation": "Object Oriented Programming is a high-level programming paradigm that focuses on data and objects, not binary code and mechanical switches.",
    "explanation_page": 5
  },
  {
    "type": "writing",
    "question": "Describe the core principles of Object Oriented Programming and how they can be applied in a cybersecurity audit context, such as a pharmaceutical company's research lab.",
    "answer": "Object Oriented Programming is based on the principles of encapsulation, inheritance, and polymorphism. In a cybersecurity audit context, these principles can be applied by creating objects that represent different components of a system, such as users, networks, and data. For example, a pharmaceutical company's research lab can create objects that represent different teams, each with their own specific role and skills, to track access and permissions.",
    "required_keywords": [
      "encapsulation",
      "inheritance",
      "polymorphism",
      "objects"
    ],
    "explanation": "The student's answer should demonstrate an understanding of the core principles of Object Oriented Programming and how they can be applied in a real-world context.",
    "explanation_page": 5
  }
]
```