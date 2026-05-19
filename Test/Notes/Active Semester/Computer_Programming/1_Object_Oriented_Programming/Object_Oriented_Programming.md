---
title: Object_Oriented_Programming
course: Computer Programming
unit: '1'
semester: Active Semester
mode: CS-SOFTWARE
type: atomic_note
hub: "[[1_Object_Oriented_Programming_Hub]]"
source: "[[Inbox/Generated/Active Semester/Computer_Programming/Chapter1.pdf]]"
date: '2026-05-18'
prerequisites:
- "[[Programming_Paradigms]]"
source_pages:
- 5
generated: true
read: false
---

## Mental Model

In a pharmaceutical R&D lab, researchers work on different compounds, each with its unique properties and behaviors, like solubility and reactivity. Just as researchers encapsulate these properties and behaviors within a compound's profile, Object-Oriented Programming encapsulates data and methods that operate on that data within objects. When multiple compounds interact, lab researchers manage these interactions by defining specific protocols, similar to how OOP manages interactions between objects through [[Inheritance]], [[Polymorphism]], and [[Encapsulation]].

## The Logic Behind the Code

[[Object_Oriented_Programming]] is a way of designing and organizing code that revolves around the concept of objects and classes. 

WHAT is Object Oriented Programming? It is a programming approach that focuses on data and objects, combining data and methods that operate on that data into a single unit. This unit is essentially a blueprint or template for creating objects, and it's called a class. 

The key idea here is that you can create many objects from the same class, and these objects can interact with each other. For example, 

WHY do we need Object Oriented Programming? Well, earlier programming approaches like unstructured and structured programming had limitations. [[Unstructured_Programming]] used "goto" statements, which led to messy and hard-to-maintain code, often referred to as "spaghetti code". Structured programming introduced functions and control structures, making the code more readable and manageable. However, it still had issues, such as requiring updates across all functions when changing a data type.

The main reason we shifted towards Object Oriented Programming is that it allows for more accurate modeling of real-world scenarios. It increases security and reuse of code, making software systems more robust and maintainable. This approach focuses on "what it is" (data/objects) rather than "how to do it" (functions), which is a more natural way of thinking about complex systems.

HOW does Object Oriented Programming work? It works by bundling data and methods that operate on that data into a single unit, which is the class. You can then create objects from this class, and these objects can have their own characteristics, like attributes and behaviors. 

For instance, think of a bank account. In a structured programming approach, you would have separate functions for withdrawing, depositing, and transferring money. In Object Oriented Programming, you would have a class called "Account" that has attributes like "balance" and methods like "withdraw", "deposit", and "transfer". This way, you can create multiple account objects, each with their own balance and behaviors.

This approach makes it easier to manage complex systems, because you can focus on the characteristics and behaviors of individual objects, rather than getting bogged down in a sea of functions and data. It's a more modular and maintainable way of designing software, which is why it's become so widely used.

## The Technical Implementation

[[Object_Oriented_Programming]] (OOP) is a programming paradigm that revolves around the concept of objects and classes, characterized by the [[Encapsulation]] of data and methods that operate on that data into a single unit, known as a class. A class serves as a blueprint or template for creating objects, which are instances of the class, and facilitates code reusability and modularity. The OOP approach focuses on organizing code around data, or objects, rather than functions and logic, enabling the creation of complex systems through the interactions and relationships between objects.

| **Object-Oriented Programming (OOP) Concepts** | **Description** |
| --- | --- |
| **Class** | A blueprint or template for creating objects. |
| **Object** | An instance of a class, with its own attributes and behaviors. |
| **[[Encapsulation]]** | Bundling data and methods that operate on that data into a single unit. |
| **[[Inheritance]]** | Creating a new class based on an existing class. |
| **[[Polymorphism]]** | The ability of an object to take on multiple forms. |


---

## The Proving Grounds

```interactive-quiz
[
  {
    "type": "mcq",
    "question": "In Object Oriented Programming, what is the term for a blueprint or template that defines the properties and behaviors of an object?",
    "options": {
      "A": "Object",
      "B": "Class",
      "C": "Method",
      "D": "Variable"
    },
    "answer": "B",
    "explanation": "A class is a blueprint or template that defines the properties and behaviors of an object, making it a fundamental concept in Object Oriented Programming.",
    "explanation_page": 5
  },
  {
    "type": "true_false",
    "question": "In Object Oriented Programming, data and methods that operate on that data are separated into different units.",
    "answer": false,
    "explanation": "In Object Oriented Programming, data and methods that operate on that data are combined into a single unit, which is a core principle of OOP.",
    "explanation_page": 5
  },
  {
    "type": "writing",
    "question": "Describe the core concept of Object Oriented Programming and how it relates to classes and objects. Provide an example from a cybersecurity audit context.",
    "answer": "Object Oriented Programming is a programming approach that focuses on data and objects, combining data and methods that operate on that data into a single unit, known as a class. A class is essentially a blueprint or template for creating objects. For example, in a cybersecurity audit, a class could represent a type of vulnerability, with properties like severity and behaviors like exploitability. Objects would be instances of these classes, each with their own set of values for these properties.",
    "required_keywords": [
      "class",
      "object",
      "properties",
      "behaviors"
    ],
    "explanation": "This question tests the student's understanding of the core concept of Object Oriented Programming and its relation to classes and objects. The example from a cybersecurity audit context requires the student to apply their knowledge in a practical scenario.",
    "explanation_page": 5
  }
]
```