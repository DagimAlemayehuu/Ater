---
title: Call_By_Value
course: Oop_With_Java
unit: '2'
semester: Winter2026
mode: CS-SOFTWARE
type: atomic_note
hub: "[[2_Object_Oriented_Programming_Hub]]"
source: "[[Inbox/Generated/Winter2026/Oop_With_Java/Chapter_Two.pdf]]"
date: '2026-05-20'
prerequisites:
- "[[Argument_Passing]]"
source_pages:
- 2
- 38
- 39
- 40
generated: true
read: false
---

## Mental Model

When you hand a sealed envelope with a specific amount of money to a bank teller, the teller gets a copy of the money's value, not the actual cash. If the teller then writes a new, higher amount on the envelope's copy, the original envelope's value remains unchanged. The original amount of money you had is still the same, even though the teller's copy shows a different value.

## The Logic Behind the Code

When we talk about Call By Value, we're discussing how computers pass information to a special part of a program called a subroutine, like a method. 

WHAT is Call By Value? 
Call By Value is a way that a computer language passes an argument to a subroutine. In this method, the actual value of the argument is passed to the parameter. 

WHY do we have Call By Value? 
The reason we have Call By Value is that it's one of the two main ways, the other being [[Call_By_Reference]], to pass arguments to subroutines. 

HOW does Call By Value work? 
Here's how it works step by step. Imagine you have a program with a main part and a method. You want to send some information from the main part to the method. 

You create a variable in the main part of your program, let's say `a = 15`, When you call a method, like `ob.meth(a, b)`, the value of `a` (which is 15) and `b` (which is 20) are copied, These copied values are then sent to the method, and Inside the method, any changes made to these values do not affect the original variables `a` and `b` in the main part of the program.

Let's look at an example from the source. T

The program looks like this: 
T

Then t

The output shows that the values of `a` and `b` remain the same after calling `ob.meth(a, b)`, which means the changes inside `meth` did not affect `a` and `b`. 

This happens because `a` and `b` were passed by value. The actual values of `a` and `b` were sent to `meth`, and changes inside `meth` did not affect the originals. 

So, Call By Value means the value of the argument is passed to the parameter, and changes made inside the method do not affect the original argument.

## The Technical Implementation

Call By Value is a parameter passing mechanism wherein the actual value of an argument is passed to a subroutine, specifically to a parameter. This method is characterized by the transmission of a copy of the argument's value to the parameter, thereby rendering any modifications made to the parameter ineffective on the original argument. In technical terms, when a primitive type is passed to a method, it is passed by value, implying that changes to the parameter do not affect the original argument.

## Where It Breaks

> **Markdown Table**

| Concept | Description | Example |
| --- | --- | --- |
| Call By Value | A method of passing arguments to a subroutine where the actual value of the argument is passed to the parameter. | `ob.meth(a, b)` where `a` and `b` are passed by value |
| Primitive Types | Passed by value, changes inside the method do not affect the original variables. | `int a = 15, b = 20; ob.meth(a, b)` |
| Object References | When passed, it's the reference that's passed by value, not the object itself. | `modify(person)` where `person` is an [[Object_Reference]] |

**Primitive Type Changes**: Changes to primitive types inside the method do not affect the original variables. 
**[[Object_Reference]] Changes**: When an object reference is passed, changes to the reference itself (like reassigning it to a new object) do not affect the original reference outside the method. 
**Passing Large Objects**: Passing large objects can be inefficient because the entire reference is passed, not a copy of the object.


---

## The Proving Grounds

```interactive-quiz
[
  {
    "type": "mcq",
    "question": "What happens to the original variable when a primitive type is passed to a method in Call By Value?",
    "options": {
      "A": "Its value is modified",
      "B": "A copy of its value is passed, and the original remains unchanged",
      "C": "The method receives a reference to the original variable",
      "D": "The variable is removed from memory"
    },
    "answer": "B",
    "explanation": "In Call By Value, when a primitive type is passed to a method, a copy of its value is passed, and the original variable remains unchanged.",
    "explanation_page": 2,
    "source_pages": [
      2,
      38,
      39,
      40
    ]
  },
  {
    "type": "true_false",
    "question": "In Call By Value, changes made to a primitive type within a method affect the original variable outside the method.",
    "answer": false,
    "explanation": "In Call By Value, changes made to a primitive type within a method do not affect the original variable outside the method because only a copy of the value is passed.",
    "explanation_page": 2,
    "source_pages": [
      2,
      38,
      39,
      40
    ]
  },
  {
    "type": "writing",
    "question": "Explain how Call By Value works when passing primitive types to a method, using an example from the provided Java code.",
    "answer": "Call By Value is a method of passing arguments to a subroutine where the actual value of the argument is passed to the parameter. In the provided Java code, when the method 'meth' is called with primitive types 'a' and 'b', copies of their values are passed. Any changes made to these values within 'meth' do not affect the original variables 'a' and 'b' in the 'main' method. For example, when 'a' is multiplied by 2 and 'b' is divided by 2 within 'meth', these changes are only reflected in the local copies of 'i' and 'j', not in 'a' and 'b'.",
    "required_keywords": [
      "primitive types",
      "copies of values",
      "subroutine"
    ],
    "explanation": "The student should explain that in Call By Value, only a copy of the primitive type's value is passed to the method, and changes within the method do not affect the original variables.",
    "explanation_page": 2,
    "source_pages": [
      2,
      38,
      39,
      40
    ]
  }
]
```