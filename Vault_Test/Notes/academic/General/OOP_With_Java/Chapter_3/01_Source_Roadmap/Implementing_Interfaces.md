---
title: "Implementing_Interfaces"
hub: "[[Chapter_3_Hub]]"
source: "[[Chapter 3.pdf]]"
source_file: "Inbox/generated/academic/Chapter 3.pdf"
source_pages: [59, 60]
source_job_id: "srcjob_4c9f3ed7e6c744f4"
domain: "CS-SOFTWARE"
concept_modality: "Qualitative/Definitional"
fallback_generation: false
generated_by: "ater_source_job"
ai_provider: "groq"
ai_model: "meta-llama/llama-4-scout-17b-16e-instruct"
---
## Mental Model
The concept of implementing interfaces in software design is crucial for defining contracts that classes must adhere to, ensuring a level of polymorphism and flexibility in the code. Interfaces act similarly to super-classes but are used to define a blueprint of methods that must be implemented by any class that implements them.

## The Working Intuition
Interfaces are used like super-classes whose properties are inherited by classes. However, unlike classes, interfaces cannot be instantiated on their own and do not have constructors. A class implements an interface by including the `implements` clause in its definition, then creating the methods defined by the interface. This allows for multiple inheritance of behavior, as a class can implement multiple interfaces.

## The Implementation Logic
The general form of a class that includes the `implements` clause is as follows:
```java
class ClassName implements InterfaceName [, InterfaceName2, …] {
// Body of Class
}
```
If a class implements more than one interface, the interfaces are separated with a comma. The methods that implement an interface must be declared `public`. For example:
```java
interface Speaker {
void speak();
}

class Politician implements Speaker {
public void speak(){
System.out.println("Talk politics");
}
}

class Priest implements Speaker {
public void speak(){
System.out.println("Religious Talks");
}
}

class Lecturer implements Speaker {
public void speak(){
System.out.println("Talks Object Oriented Design and Programming!");
}
}
```
## Failure Modes And Edge Cases
One common failure mode is forgetting to implement all methods defined by the interface or incorrectly declaring their access modifiers. For instance, if a method in the interface is declared as `public`, implementing it without the `public` access modifier will result in a compilation error. Another edge case is trying to implement an interface without the `implements` keyword or mistakenly using the `extends` keyword, which is used for inheriting from classes.

## The Proving Grounds
```interactive-quiz
[
{
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "write_or_explain_code",
"skill_target": "Implementing Interfaces",
"question": "Implement the 'Printable' interface for a 'Document' class.",
"rubric": {
"grading_mode": "rubric",
"must_include": [
"public class Document",
"implements Printable",
"public void print()"
]
},
"remediation": {
"misconception_codes": [
"missing_implementation"
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
"skill_target": "Implementing Interfaces",
"question": "What is the error in: 'class A implements B { void methodB() {}}' if 'B' defines a public method 'void methodB()'? ",
"rubric": {
"grading_mode": "objective",
"must_include": [
"access modifier"
]
},
"remediation": {
"misconception_codes": [
"access_modifiers"
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
"skill_target": "Implementing Interfaces",
"question": "Explain the steps to implement an interface in Java.",
"rubric": {
"grading_mode": "rubric",
"must_include": [
"define the interface",
"implement the interface",
"provide implementation for interface methods"
]
},
"remediation": {
"misconception_codes": [
"process_steps"
],
"follow_up_policy": "different_family_or_format"
},
"type": "writing"
}
]
```
