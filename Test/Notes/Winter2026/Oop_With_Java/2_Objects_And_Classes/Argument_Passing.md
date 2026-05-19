---
title: Argument_Passing
course: Oop With Java
unit: '2'
semester: Winter2026
mode: SOC-STRATIFICATION
type: atomic_note
hub: "[[2_Objects_And_Classes_Hub]]"
source: "[[Inbox/Generated/Winter2026/Oop_With_Java/Chapter_Two.pdf]]"
date: '2026-05-18'
prerequisites: []
source_pages:
- 2
generated: true
read: false
---

## Mental Model

In a pharmaceutical laboratory, a scientist prepares a precise medication dosage by measuring out specific amounts of ingredients, which are then passed to a pharmacist for assembly into a final prescription. Similarly, when a method is called in Java, the required arguments are "measured out" and passed to the method, allowing it to compute a result. Just as the pharmacist combines the ingredients according to a recipe, the method combines the arguments to produce a specific outcome.

## Core Concept

[[Argument_Passing]] is a way to provide information to a method or a program when it's called. 
WHAT precisely is Argument Passing: It's when you pass values to a method, like a [[Main_Method]], so it can use those values to do its job. In Java, when you run a program from the command line, you can type in extra information after the name of the program, like this: "java Program arg1 arg2". These extra pieces of information, "arg1" and "arg2", are called arguments.

The underlying reason, WHY, for Argument Passing is to make programs more flexible and reusable. Instead of having a program that always does the same thing, you can write a program that can do different things based on the arguments you give it. For example, a program that says hello to a specific person can use an argument to find out who that person is.

The mechanism of HOW Argument Passing works in Java is as follows: when you run a Java program from the command line, you type in the program name followed by any arguments you want to pass. The Java program captures these arguments in a special array called "args". This array is built into the main method of a Java program, which has a special signature: "public static void main(String[] args)". 

The "args" in this signature is an array of strings that holds all the arguments you typed in after the program name. You can then use these arguments inside your program. For instance, in the example given, "System.out.println("Hi, " + args[0]);" uses the first argument you provided to print out a personalized greeting. The "args[0]" refers to the first item in the "args" array, which is the first argument you typed in after the program name.

## The Textbook Translation

[[Argument_Passing]] is a mechanism that enables the provision of input data to a method or program at invocation, facilitating the execution of specific tasks. It involves the transfer of values to a method, such as the [[Main_Method]], allowing it to utilize these values in its operations. In the context of Java, Argument Passing occurs when command-line arguments are supplied after the program name, in the format "java Program arg1 arg2", where arg1 and arg2 represent the input values being passed to the program.

| Concept | Description | Example |
| --- | --- | --- |
| [[Argument_Passing]] | Passing values to a method or program | `java SayHi Aman` |
| Command Line Arguments | Extra information after the program name | `arg1`, `arg2` |
| args Array | Built-in array in the [[Main_Method]] | `String[] args` |


---

## The Proving Grounds

```interactive-quiz
[
  {
    "type": "mcq",
    "question": "In the context of Argument Passing, what is the primary purpose of providing arguments to a method when it is called?",
    "options": {
      "A": "To modify the method's return type",
      "B": "To provide input values for the method to process",
      "C": "To change the method's access modifier",
      "D": "To instantiate a new object"
    },
    "answer": "B",
    "explanation": "Argument Passing is a way to provide information to a method or a program when it's called, allowing the method to use those values to perform its job.",
    "explanation_page": 2
  },
  {
    "type": "true_false",
    "question": "Argument Passing is only applicable to instance methods and not to static methods.",
    "answer": false,
    "explanation": "Argument Passing can be applied to both instance and static methods, as it is a way to provide input values to a method regardless of its type.",
    "explanation_page": 2
  },
  {
    "type": "writing",
    "question": "Describe how Argument Passing works in the context of a Java program, using the example of a pharmaceutical laboratory preparing a medication dosage.",
    "answer": "Argument Passing is a process where values are passed to a method, allowing it to perform its job. In Java, this can be achieved by providing arguments to a method when it is called, similar to how a scientist provides specific ingredients to a pharmacist to assemble a medication. For instance, when running a Java program from the command line, extra information can be provided after the program name, which can be accessed and used by the program.",
    "required_keywords": [
      "Argument Passing",
      "method",
      "values",
      "Java"
    ],
    "explanation": "A correct answer should demonstrate an understanding of Argument Passing and its application in Java, using relevant examples and terminology.",
    "explanation_page": 2
  }
]
```