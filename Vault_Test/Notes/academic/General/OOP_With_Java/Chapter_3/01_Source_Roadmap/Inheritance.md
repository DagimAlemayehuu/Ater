---
title: "Inheritance"
hub: "[[Chapter_3_Hub]]"
source: "[[Chapter 3.pdf]]"
source_file: "Inbox/generated/academic/Chapter 3.pdf"
source_pages: [10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
source_job_id: "srcjob_4c9f3ed7e6c744f4"
domain: "CS-SOFTWARE"
concept_modality: "Qualitative/Definitional"
fallback_generation: false
generated_by: "ater_source_job"
ai_provider: "groq"
ai_model: "meta-llama/llama-4-scout-17b-16e-instruct"
---
## Mental Model

Inheritance is a fundamental concept in object-oriented programming (OOP) that allows one class to inherit the properties and behavior of another class. The class being inherited is called the superclass or parent class, while the class doing the inheriting is called the subclass or child class. This mechanism enables code reuse, facilitates the creation of a hierarchy of related classes, and supports the development of more complex and specialized classes.

## The Working Intuition

Inheritance is based on the idea that a subclass is a specialized version of the superclass. The subclass inherits all the fields and methods of the superclass and can also add new fields and methods or override the ones inherited from the superclass. This allows for a more hierarchical organization of code, where a subclass can build upon the common attributes and behaviors defined in the superclass.

For example, consider a superclass called `Vehicle` that has attributes like `color` and `speed`, and methods like `accelerate()` and `brake()`. A subclass called `Car` can inherit from `Vehicle` and add its own specific attributes like `number_of_doors` and `transmission_type`, as well as override the `accelerate()` method to provide a more specific implementation.

## The Implementation Logic

In Java, inheritance is implemented using the `extends` keyword. The general form of a subclass declaration is:
```java
class SubClassName extends SuperClassName {
// body of class
}
```
The subclass inherits all the members (fields and methods) of the superclass and can also add new members or override the ones inherited from the superclass.

For instance, consider the following example:
```java
class Box {
double width;
double height;
double depth;

// constructor
Box(double w, double h, double d) {
width = w;
height = h;
depth = d;
}

// method
double volume() {
return width * height * depth;
}
}

class BoxWeight extends Box {
double weight;

// constructor
BoxWeight(double w, double h, double d, double m) {
super(w, h, d);
weight = m;
}
}
```
In this example, the `BoxWeight` class inherits from the `Box` class and adds a new field `weight` and a new constructor that takes an additional parameter `m`.

## Failure Modes And Edge Cases

One common pitfall in using inheritance is the misuse of the `super` keyword. The `super` keyword is used to access the members of the superclass from a subclass. However, if the subclass has a field or method with the same name as a field or method in the superclass, the subclass's member will hide or override the superclass's member.

Another edge case is when a subclass tries to access a private member of the superclass. Since private members are not accessible from outside the class, the subclass will not be able to access them directly.

## The Proving Grounds

```interactive-quiz
[
{
"id": "q1",
"type": "writing",
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "write_or_explain_code",
"skill_target": "Inheritance",
"question": "Write a Java class that inherits from a superclass called `Shape` and adds a new field `color` and a new method `draw()`.",
"rubric": {
"grading_mode": "rubric",
"must_include": [
"inheritance",
"superclass",
"subclass"
]
},
"remediation": {
"misconception_codes": [
"missing_definition"
],
"follow_up_policy": "different_family_or_format"
}
},
{
"id": "q2",
"type": "mcq",
"schema_version": 2,
"family": "recognize",
"format": "choice",
"variant": "domain-specific question variant",
"skill_target": "Inheritance",
"question": "What is the purpose of the `extends` keyword in Java?",
"options": {
"A": "To implement an interface",
"B": "To inherit from a superclass",
"C": "To create a new class",
"D": "To override a method"
},
"answer": "B",
"explanation": "The `extends` keyword is used to inherit from a superclass.",
"rubric": {
"grading_mode": "objective",
"must_include": []
},
"remediation": {
"misconception_codes": [
"incorrect_syntax"
],
"follow_up_policy": "different_family_or_format"
}
}
]
```
