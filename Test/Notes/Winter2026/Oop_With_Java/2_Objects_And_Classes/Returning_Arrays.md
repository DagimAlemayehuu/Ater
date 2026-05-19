---
title: Returning_Arrays
course: Oop With Java
unit: '2'
semester: Winter2026
mode: SOC-STRATIFICATION
type: atomic_note
hub: "[[2_Objects_And_Classes_Hub]]"
source: "[[Inbox/Generated/Winter2026/Oop_With_Java/Chapter_Two.pdf]]"
date: '2026-05-18'
prerequisites:
- "[[Objects_And_Classes]]"
source_pages:
- 50
generated: true
skeleton_fallback: true
read: false
---

## Mental Model

Returning Arrays is a foundational concept within this domain. class Main{ public static void main(String[] args){ int[] result = performCalculations(5, 3); [SOURCE EXCERPT] // get volume of cube vol = mycube.volume(); System.out.println("Volume of mycube is "+vol); } } 35 The output produced by this program is shown here: Volume of mybox1 is 3000.0 Volume of mybox2 is -1.0 Volume of mycube is 343.0 Using Objects as Parameters – So far, we have been using simple type as parameters – However, it is both correct & common to pass objects too – consider the following simple program: // Objects may be passed to methods. class Test { int a, b; Test(int i, int j) { a = i; b = j; } 36 // return true if o is equal to the invoking // object boolean equals(Test o) { if(o.a == a && o.b == b) return true; else return false; } } class PassOb { public static void main(String args[]) { Test ob1 = new Test(100, 22); Test ob2 = new Test(100, 22); Test ob3 = new Test(-1, -1); System.out.println("ob1 == ob2: " + ob1.equals(ob2)); System.out.println("ob1 == ob3: " + ob1.equals(ob3)); } } 37 – This program generates the following output: ob1 == ob2: true ob1 == ob3: false – One of the most common uses of object parameters involves constructors. Argument Passing – there are two ways that a computer language can pass an argument to a subroutine.

## Core Concept

The practical operation of Returning Arrays centers on the following principles. – The first way is call-by-value. – The second way an argument can be passed is call-by- reference. a reference to an argument (not the value of the argument) is passed to the parameter.

## The Textbook Translation

At a formal level, Returning Arrays is governed by the following constraints and definitions. changes made to the parameter will affect the argument used to call the subroutine. – when you pass a primitive type to a method, it is passed by value. 38 – consider the following program: // Simple types are passed by value. class Test { void meth(int i, int j) { i *= 2; j /= 2; } } class CallByValue { public static void main(String args[]) { Test ob = new Test(); int a = 15, b = 20; System.out.println("a and b before call: " + a + " " + b); ob.meth(a, b); System.out.println("a and b after call: " + a + " " + b); } } 39 – The output from this program is shown here: a and b before call: 15 20 a and b after call: 15 20 Passing an object to pass by value class Main{ public static void main(String[] args){ Person person = new Person(“Abebe”); System.out.println(“Before: “+person.getName()); modify(person); System.out.println(“After: “+person.getName()); } public static void modify(Person p){ p = new Person(“Sara”); System.out.println(“Inside: “+ p.getName()); } } 4/5/2026 40 class Person { private String name; public Person(String name) { this.name = name; } public String getName() { return name; } public void setName(String name) { this.name = name; } } Output: Before: Abebe After: Sara Inside: Abebe 4/5/2026 41 Passing objects as arguments (“Passing by Reference”) – The actual object reference is passed by value: class Main{ public static void main(String[] args){ Person person = new Person(“Abebe”); System.out.println(“Before: “+person.getName()

> **Markdown Table**

```markdown

| Property | Value |
|----------|-------|
| Concept  | Returning Arrays |
| Domain   | this domain |
| Source   | Chapter material |
```


---

## The Proving Grounds

```interactive-quiz
[
  {
    "type": "mcq",
    "question": "Which of the following best defines Returning Arrays?",
    "options": {"A": "class Main{ public static void main(String[] args){ int[] result = performCalcul", "B": "An unrelated concept", "C": "A deprecated approach", "D": "None of the above"},
    "answer": "A",
    "explanation": "Returning Arrays is defined by its relationship to this domain as described in the source material."
  }
]
```