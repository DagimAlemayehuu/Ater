---
title: Object_Instantiation
course: Oop With Java
unit: '2'
semester: Winter2026
mode: SOC-STRATIFICATION
type: atomic_note
hub: "[[2_Objects_And_Classes_Hub]]"
source: "[[Inbox/Generated/Winter2026/Oop_With_Java/Chapter_Two.pdf]]"
date: '2026-05-18'
prerequisites:
- "[[Class_Definition]]"
source_pages:
- 3
generated: true
read: false
---

## Mental Model

In a pharmaceutical laboratory, a recipe for a specific medicine is like a class, detailing the exact ingredients and procedures to create one dose. When a pharmacist follows the recipe to create a dose, they are instantiating the medicine, making a real, tangible object from the abstract plan. Just as multiple doses of the same medicine can be created from the same recipe, multiple objects can be instantiated from the same class.

## Core Concept

[[Object_Instantiation]] is a process in Java where an object is created from a class. 
The term "object" refers to an instance of a class. In other words, an object is a specific entity that has its own set of attributes and methods, which are defined in the class.

The underlying reason for object instantiation is to allow multiple instances of a class to exist, each with its own set of characteristics. This is useful because it enables developers to create multiple objects that share the same structure and behavior, but have different properties.

The mechanism of object instantiation involves several steps. First, a class is defined, which serves as a blueprint or template for creating objects. The class defines the attributes and methods that an object will have. 

When an object is instantiated, Java allocates memory for the object and initializes its attributes. This is done using a special method called a constructor, which is a method that has the same name as the class and is used to initialize objects when they are created.

For example, if we have a class called "HelloWorld", we can instantiate an object from this class by writing code that says "HelloWorld myObject = new HelloWorld();". 

In this example, "myObject" is an instance of the "HelloWorld" class, and it has its own set of attributes and methods, which are defined in the "HelloWorld" class. 

The "new" keyword is used to create a new object, and it allocates memory for the object and calls the constructor to initialize it.

It is worth noting that an object is an instance of a class, and a Java program can be seen as a collection of objects satisfying certain requirements and interacting through functionalities made public.

## The Textbook Translation

[[Object_Instantiation]] is the process of creating an instance of a class, whereby an object is instantiated from a [[Class_Definition]]. This process enables the creation of multiple instances of a class, each possessing its own distinct set of attributes and methods as defined in the class. Let O be an object and C be a class; then, O is an instance of C, denoted as O ∈ C, where C defines the structure and behavior of O.

### [[Object_Instantiation]] in Java

| Concept | Description |
| --- | --- |
| **Class** | A blueprint or template for creating objects. |
| **Object** | An instance of a class, with its own attributes and methods. |
| **Instantiation** | The process of creating an object from a class. |
| **Constructor** | A special method used to initialize objects when they are created. |
| **new Keyword** | Used to create a new object and allocate memory for it. |

### Example of Object Instantiation

```java
class HelloWorld {
    public static void main(String[] args) {
        HelloWorld myObject = new HelloWorld();
    }
}
```

In this example, `myObject` is an instance of the `HelloWorld` class.

### Object Instantiation Process

Define a class, Use the `new` keyword to create a new object, Allocate memory for the object, and Call the constructor to initialize the object.

### Mental Model Analogy

In a pharmaceutical laboratory, a recipe for a specific medicine is like a class. When a pharmacist follows the recipe to create a dose, they are instantiating the medicine, making a real, tangible object from the abstract plan.


---

## The Proving Grounds

```interactive-quiz
[
  {
    "type": "mcq",
    "question": "In the context of a pharmaceutical laboratory, what is the process of creating a specific dose of medicine from a recipe comparable to in Java?",
    "options": {
      "A": "Object Instantiation",
      "B": "Class Definition",
      "C": "Method Invocation",
      "D": "Attribute Assignment"
    },
    "answer": "A",
    "explanation": "Object Instantiation is the process of creating an object from a class, similar to how a pharmacist creates a dose of medicine from a recipe.",
    "explanation_page": 3
  },
  {
    "type": "true_false",
    "question": "An object in Java can exist without being an instance of a class.",
    "answer": false,
    "explanation": "According to the source context, an object is an instance of a class, implying that an object cannot exist without being an instance of a class.",
    "explanation_page": 3
  },
  {
    "type": "writing",
    "question": "Explain the concept of Object Instantiation in Java, using an example from a pharmaceutical laboratory. Be sure to include the terms 'class', 'object', and 'instance'.",
    "answer": "Object Instantiation in Java is the process of creating an object from a class. A class is like a recipe for a specific medicine, detailing the exact ingredients and procedures to create one dose. When a pharmacist follows the recipe to create a dose, they are instantiating the medicine, making a specific entity that has its own set of attributes and methods. In Java, this means creating an object that is an instance of the class, with its own set of characteristics.",
    "required_keywords": [
      "class",
      "object",
      "instance"
    ],
    "explanation": "The student should demonstrate an understanding of Object Instantiation by explaining the analogy between a pharmaceutical laboratory and Java, including the terms 'class', 'object', and 'instance'.",
    "explanation_page": 3
  }
]
```