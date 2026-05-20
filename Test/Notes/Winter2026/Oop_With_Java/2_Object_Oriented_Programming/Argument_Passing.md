---
title: Argument_Passing
course: Oop_With_Java
unit: '2'
semester: Winter2026
mode: CS-SOFTWARE
type: atomic_note
hub: "[[2_Object_Oriented_Programming_Hub]]"
source: "[[Inbox/Generated/Winter2026/Oop_With_Java/Chapter_Two.pdf]]"
date: '2026-05-20'
prerequisites: []
source_pages:
- 2
- 14
- 38
- 42
generated: true
read: false
---

## Mental Model

When you send a package to a friend through a courier, you can either give the courier a copy of the package contents (call-by-value) or hand over the original package (call-by-reference). If you give a copy, changes the courier makes to the copy won't affect your original package, but if you hand over the original, any changes the courier makes will be reflected when you receive it back. Similarly, when passing arguments to a method, primitive types are like package copies, while objects are like handing over a reference to the original package, allowing changes to affect the original.

## The Logic Behind the Code

Argument Passing is a way of giving information to a method or a constructor when it's called. 

WHAT is Argument Passing? 
Argument Passing is a mechanism that allows a method or constructor to receive information from the caller. This information is passed in the form of arguments.

WHY do we need Argument Passing? 
The reason we need Argument Passing is that it allows methods and [[Constructors]] to be more flexible and reusable. Without Argument Passing, a method or constructor would have to know everything about the data it's working with, which would make it inflexible and hard to use in different situations.

HOW does Argument Passing work? 
There are two main ways that Argument Passing can work: call-by-value and call-by-reference. 

When you pass a primitive type, such as a number or a boolean, to a method, it's passed by value. This means that a copy of the value is made and passed to the method. If the method changes the value, it won't affect the original value outside the method.

On the other hand, when you pass an object to a method, the actual [[Object_Reference]] is passed by value. This means that a copy of the reference is made and passed to the method. The method receives this reference and can use it to access and modify the object. 

For example, consider a Person object with the name "Abebe". If you pass this object to a method that changes its name to "Sara", the change will be visible outside the method because both the original reference and the copied reference point to the same object.

The process of Argument Passing works as follows: first, a reference variable is created for the object, then the object is instantiated and assigned to the reference variable. When the object is passed to a method, a copy of the reference is made and passed to the method. 

The key point to understand is that the reference itself is passed by value, but it points to the same object as the original reference. So, changes made to the object through the method will affect the original object.

For instance, in the example given, the output will be: 
Before: Abebe 
Inside: Sara 
After: Sara 

This shows that the change made to the object's name inside the method was visible outside the method, because the method received a reference to the same object.

## The Technical Implementation

Argument Passing is a programming mechanism that facilitates the transmission of information from a caller to a method or constructor, enabling the method or constructor to operate on the provided data. This process involves the transfer of values or references to parameters, which are then utilized by the method or constructor to perform specific operations. There are two primary modes of Argument Passing: call-by-value, wherein a copy of the argument's value is passed to the parameter, and call-by-reference, wherein a reference to the argument is passed, allowing modifications to the original argument.

## Where It Breaks

> **Markdown Table**

| **Concept** | **Description** |
| --- | --- |
| Argument Passing | A mechanism that allows a method or constructor to receive information from the caller. |
| Call-by-Value | A method of passing arguments where a copy of the value is made and passed to the method. |
| Call-by-Reference | A method of passing arguments where a reference to the argument is passed to the parameter. |
| Primitive Types | Passed by value, e.g., int, boolean. |
| Object References | Passed by value, but point to the same object, allowing changes to affect the original object. |
| Example | `modify(person)` changes the `person` object's name, demonstrating call-by-reference behavior. |

**Incorrect Use of Primitive Types**: Assuming primitive types are passed by reference can lead to unexpected behavior. 
**Misunderstanding Object References**: Not recognizing that object references are passed by value can cause confusion about changes to objects. 
**Overlooking Argument Passing Mechanisms**: Failing to distinguish between call-by-value and call-by-reference can result in incorrect implementation of methods.


---

## The Proving Grounds

```interactive-quiz
[
  {
    "type": "mcq",
    "question": "In the context of a cybersecurity audit, a junior auditor is tasked with analyzing a Java method that takes an array of IP addresses as an argument. If the method modifies the array by adding a new IP address, what happens to the original array in the calling method?",
    "options": {
      "A": "The original array remains unchanged",
      "B": "The original array is modified",
      "C": "The method call will result in a compile-time error",
      "D": "The method will throw a runtime exception"
    },
    "answer": "B",
    "explanation": "In Java, when an array is passed as an argument to a method, it is passed by reference. This means that any changes made to the array within the method affect the original array in the calling method. Therefore, if the method modifies the array by adding a new IP address, the original array in the calling method will also be modified.",
    "explanation_page": 2,
    "source_pages": [
      2,
      14,
      38,
      42
    ]
  },
  {
    "type": "true_false",
    "question": "In Java, primitive types such as int or boolean are passed by reference when used as method arguments.",
    "answer": false,
    "explanation": "In Java, primitive types such as int or boolean are passed by value when used as method arguments, not by reference. This means that any changes made to these types within a method do not affect the original values in the calling method.",
    "explanation_page": 2,
    "source_pages": [
      2,
      14,
      38,
      42
    ]
  },
  {
    "type": "writing",
    "question": "Explain the difference between call-by-value and call-by-reference in the context of Argument Passing, using an example from a cybersecurity audit scenario.",
    "answer": "Call-by-value and call-by-reference are two mechanisms of Argument Passing. In call-by-value, a copy of the argument value is passed to the method, whereas in call-by-reference, a reference to the original argument is passed. For example, in a cybersecurity audit, if a method takes an IP address as an argument and modifies it, the change will only affect the copy (call-by-value) or the original IP address (call-by-reference). In Java, primitive types are passed by value, while objects are passed by reference. For instance, if a method takes an array of IP addresses as an argument and modifies it, the original array will be changed because arrays are objects and are passed by reference.",
    "required_keywords": [
      "call-by-value",
      "call-by-reference",
      "Argument Passing"
    ],
    "explanation": "The student's answer should demonstrate an understanding of the concepts of call-by-value and call-by-reference, and how they apply to Argument Passing in Java. The example used should be relevant to a cybersecurity audit scenario.",
    "explanation_page": 2,
    "source_pages": [
      2,
      14,
      38,
      42
    ]
  }
]
```