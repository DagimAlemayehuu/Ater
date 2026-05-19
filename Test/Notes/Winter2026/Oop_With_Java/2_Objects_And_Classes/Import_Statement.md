---
title: Import_Statement
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
- 3
generated: true
skeleton_fallback: true
read: false
---

## Mental Model

Import Statement is a foundational concept within this domain. import statement(s) [SOURCE EXCERPT] Chapter Two Objects and Classes 4/5/2026 1 Contents to Cover Java Program Structure Members of a class – Attributes: Instance & Static – Methods: Instance & static final keyword: Instance final and static final Object Instantiation Constructors – Types of Constructors Static block Vs. Instance Block this keyword: scope resolution & constructor calling Access Modifier Package Method and constructor Overloading Argument Passing Garbage collection 2 Java Language Basics A program in Java is a set of class declarations An object is an instance of a class A Java program can be seen as a collection of objects satisfying certain requirements and interacting through functionalities made public The name of the class coincides with that of the file The structure of Java program is: [Documentation] [package statement] [import statement(s)] [interface statement] [class definition] main method class definition 34/5/2026 In the Java language, the simplest form of a class definition is class name { .

## Core Concept

The practical operation of Import Statement centers on the following principles. } Class name must be the same as the file name where the class lives A program can contain one or more class definitions but only one public class definition The program can be created in any text editor If a file contains multiple classes, the file name must be the class name of the class that contains the main method 4/5/2026 4 Your First Java Program // your first java application import java.lang.*; class HelloWorld { public static void main(String[] args){ System.out.println("Hello World!"); } } Save this file as HelloWorld.java (watch capitalization) Classes, methods and related statements are enclosed between { ... } 54/5/2026 main - A Special Method The main method is where a Java program always starts when you run a class file with the java command The main method has a strict signature which must be followed: public static void main(String[] args) { .

## The Textbook Translation

At a formal level, Import Statement is governed by the following constraints and definitions. } public (access modifier) makes the item visible from outside the class static indicates that the main() method is a class method not an instant method. – It allows main() to be called without instantiating a particular instance of the class 64/5/2026 class SayHi { public static void main(String[] args) { System.out.println("Hi, " + args[0]); } } When java Program arg1 arg2 … argN is typed on the command line, – anything after the name of the class file is automatically entered into the args array: java SayHi Aman In this example args[0] will contain the String “Aman", and the output of the program will be "Hi, Aman". 74/5/2026 Compiling and Running Your First Program Open the command prompt in Windows. – Change the path to the directory where your files is stored To compile the program, type the following at the command prompt: javac HelloWorld.java You have now created your first compiled Java prog

> **Markdown Table**

```markdown

| Property | Value |
|----------|-------|
| Concept  | Import Statement |
| Domain   | this domain |
| Source   | Chapter material |
```


---

## The Proving Grounds

```interactive-quiz
[
  {
    "type": "mcq",
    "question": "Which of the following best defines Import Statement?",
    "options": {"A": "import statement(s) [SOURCE EXCERPT] Chapter Two Objects and Classes 4/5/2026 1 ", "B": "An unrelated concept", "C": "A deprecated approach", "D": "None of the above"},
    "answer": "A",
    "explanation": "Import Statement is defined by its relationship to this domain as described in the source material."
  }
]
```