---
title: Inheritance
course: Computer Programming
unit: '1'
semester: Active Semester
mode: CS-SOFTWARE
type: atomic_note
hub: "[[1_Object_Oriented_Programming_Hub]]"
source: "[[Inbox/Generated/Active Semester/Computer_Programming/Chapter1.pdf]]"
date: '2026-05-18'
prerequisites:
- "[[Object_Oriented_Programming]]"
source_pages:
- 14
generated: true
read: false
---

## Mental Model

In a pharmaceutical company's research and development department, a team creates a base formulation for a new medication, which includes a specific set of active ingredients and a patented delivery mechanism. This base formulation serves as a blueprint for various related medications, each of which can inherit and build upon the original formulation by adding or modifying specific components, such as adjusting the dosage or adding a new ingredient, while retaining the core characteristics of the original. As a result, the company can efficiently develop a range of related medications, each with its own unique features, by inheriting and extending the base formulation rather than starting from scratch.

## The Logic Behind the Code

[[Inheritance]] is a concept in Object-Oriented Programming. 
WHAT precisely is Inheritance: It is not directly defined in the source text but based on the information provided about Object-Oriented Programming, we can deduce that Inheritance is a mechanism where one object or class can inherit the properties of another object or class. 

The source text explains that in Object-Oriented Programming, the focus is on data and objects, and it allows for accurate real-world modeling, increased security, and reuse. It mentions that multiple independent objects can be created from the same class and interact together.

WHY is Inheritance needed: The source text highlights limitations of Structured Programming, such as changing a data type requiring updates across all functions in the application and difficulty in modeling real-world scenarios accurately. Inheritance helps overcome these limitations by allowing for code reuse and facilitating the creation of new classes based on existing ones, which aids in modeling real-world scenarios more accurately.

HOW does Inheritance work: The source text does not provide a step-by-step explanation of the Inheritance mechanism. However, it does explain the evolution from complexity to modularity and maintainability in [[Programming_Paradigms]], shifting the focus from "How to do it" to "What it is." This implies that Inheritance is a part of Object-Oriented Programming that enables the creation of a new class from an existing class, thereby promoting code reuse and modularity.

## The Technical Implementation

[[Inheritance]] is a fundamental concept in Object-Oriented Programming (OOP) that enables a class or object to inherit the properties, attributes, and behavior of another class or object. This mechanism allows for code reuse and facilitates the creation of a new class or object based on an existing one, promoting a hierarchical relationship between classes. In this context, the inheriting class or object is referred to as the subclass or derived class, while the class or object being inherited from is referred to as the superclass or base class.

| **Concept** | **Description** |
| --- | --- |
| [[Inheritance]] | A mechanism in Object-Oriented Programming where one object or class can inherit the properties of another object or class. |
| Class | A blueprint or template for creating objects. |
| Object | An instance of a class, representing a real-world entity. |
| Code Reuse | The ability to use existing code to develop new programs or features. |
| Modularity | The degree to which a system is composed of independent modules. |
| Real-world Modeling | The process of representing real-world scenarios using classes and objects. |


---

## The Proving Grounds

```interactive-quiz
[
  {
    "type": "mcq",
    "question": "In a cloud infrastructure, a developer creates a base class called 'VirtualMachine' with properties like 'cpu' and 'memory'. A new class 'HighPerformanceVM' is created to inherit the properties of 'VirtualMachine' and add an additional property 'gpu'. Which of the following statements is true about the relationship between 'VirtualMachine' and 'HighPerformanceVM'?",
    "options": {
      "A": "HighPerformanceVM is a subclass of VirtualMachine",
      "B": "VirtualMachine is a subclass of HighPerformanceVM",
      "C": "HighPerformanceVM and VirtualMachine are sibling classes",
      "D": "HighPerformanceVM and VirtualMachine are unrelated classes"
    },
    "answer": "A",
    "explanation": "Inheritance is a mechanism where one class can inherit the properties of another class. In this case, HighPerformanceVM inherits the properties of VirtualMachine, making HighPerformanceVM a subclass of VirtualMachine.",
    "explanation_page": 14
  },
  {
    "type": "true_false",
    "question": "Inheritance allows a class to inherit the properties of multiple parent classes.",
    "answer": false,
    "explanation": "Inheritance typically allows a class to inherit the properties of a single parent class. While some programming languages support multiple inheritance, it is not a fundamental characteristic of inheritance.",
    "explanation_page": 14
  },
  {
    "type": "writing",
    "question": "Describe how inheritance can be applied in a cloud infrastructure to create a hierarchy of classes for different types of virtual machines. Provide an example.",
    "answer": "Inheritance can be used to create a hierarchy of classes for different types of virtual machines by creating a base class 'VirtualMachine' with common properties and methods, and then creating subclasses like 'WindowsVM', 'LinuxVM', and 'HighPerformanceVM' that inherit the properties of 'VirtualMachine' and add their own specific properties and methods. For example, 'HighPerformanceVM' can inherit the properties of 'VirtualMachine' and add an additional property 'gpu'.",
    "required_keywords": [
      "inheritance",
      "class hierarchy",
      "virtual machine"
    ],
    "explanation": "This question tests the student's ability to apply the concept of inheritance in a cloud infrastructure context. The answer should demonstrate an understanding of how inheritance can be used to create a hierarchy of classes for different types of virtual machines.",
    "explanation_page": 14
  }
]
```