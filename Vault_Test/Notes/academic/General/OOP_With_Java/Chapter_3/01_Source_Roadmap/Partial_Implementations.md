---
title: "Partial_Implementations"
hub: "[[Chapter_3_Hub]]"
source: "[[Chapter 3.pdf]]"
source_file: "Inbox/generated/academic/Chapter 3.pdf"
source_pages: [61, 62, 63]
source_job_id: "srcjob_4c9f3ed7e6c744f4"
domain: "CS-SOFTWARE"
concept_modality: "Qualitative/Definitional"
fallback_generation: false
generated_by: "ater_source_job"
ai_provider: "groq"
ai_model: "meta-llama/llama-4-scout-17b-16e-instruct"
---
## Mental Model
The concept of partial implementations in software development refers to a class that implements an interface but does not provide an implementation for all the methods defined in that interface. In such cases, the class must be declared as abstract.

## The Working Intuition
When designing software, interfaces are used to define a contract that must be implemented by any class that implements it. However, there might be situations where a class can only partially implement the interface, either because some methods are not yet fully understood or because their implementation depends on additional context or requirements that are not yet available. In these cases, a partial implementation allows developers to create a class that provides some functionality while leaving the rest to be implemented later.

## The Implementation Logic
To implement a partial implementation, a class must implement an interface but can leave some methods without an implementation. These methods must then be declared in a subclass that extends the abstract class. The use of abstract classes and interfaces allows for a flexible and modular design.

For example, consider an interface `A` that defines two methods: `meth1()` and `meth2()`. Another interface `B` extends `A` and adds a third method `meth3()`. A class `MyClass` can implement `B` but only provide implementations for `meth1()` and `meth2()`, leaving `meth3()` to be implemented by a subclass.

```java
interface A {
void meth1();
void meth2();
}

interface B extends A {
void meth3();
}

abstract class MyClass implements B {
public void meth1() {
System.out.println("Implement meth1().");
}

public void meth2() {
System.out.println("Implement meth2().");
}
}
```

## Failure Modes And Edge Cases
One common failure mode is attempting to instantiate an abstract class that does not fully implement an interface. This will result in a compile-time error. Another edge case is when a subclass fails to implement all the abstract methods of its superclass. In this case, the subclass must also be declared as abstract.

## The Proving Grounds
```interactive-quiz
[
{
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "write_or_explain_code",
"skill_target": "Partial Implementations",
"question": "Complete the implementation of the MyClass class to implement interface B.",
"rubric": {
"grading_mode": "rubric",
"must_include": [
"meth1()",
"meth2()",
"meth3()"
]
},
"remediation": {
"misconception_codes": [
"missing_definition"
],
"follow_up_policy": "different_family_or_format"
},
"type": "writing"
},
{
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "find_and_fix_reasoning",
"skill_target": "Partial Implementations",
"question": "What happens when you try to instantiate an abstract class that implements an interface but does not fully implement it?",
"rubric": {
"grading_mode": "objective",
"must_include": [
"compile-time error"
]
},
"remediation": {
"misconception_codes": [
"instantiation_of_abstract_class"
],
"follow_up_policy": "different_family_or_format"
},
"type": "writing"
},
{
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "step_trace",
"skill_target": "Partial Implementations",
"question": "Explain the steps to create a partial implementation of an interface in Java.",
"rubric": {
"grading_mode": "rubric",
"must_include": [
"declare abstract class",
"implement some methods"
]
},
"remediation": {
"misconception_codes": [
"incomplete_implementation"
],
"follow_up_policy": "different_family_or_format"
},
"type": "writing"
}
]
```
