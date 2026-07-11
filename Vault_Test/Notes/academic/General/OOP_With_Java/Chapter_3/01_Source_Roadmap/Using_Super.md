---
title: "Using_Super"
hub: "[[Chapter_3_Hub]]"
source: "[[Chapter 3.pdf]]"
source_file: "Inbox/generated/academic/Chapter 3.pdf"
source_pages: [28, 29]
source_job_id: "srcjob_4c9f3ed7e6c744f4"
domain: "CS-SOFTWARE"
concept_modality: "Qualitative/Definitional"
fallback_generation: false
generated_by: "ater_source_job"
ai_provider: "groq"
ai_model: "meta-llama/llama-4-scout-17b-16e-instruct"
---
## Mental Model

The concept of `super` in object-oriented programming is used to refer to the immediate superclass of a subclass. This allows the subclass to access and utilize the properties and methods of its superclass.

## The Working Intuition

The working intuition behind `super` is to enable a subclass to build upon the properties and behavior of its superclass. When a subclass needs to refer to its immediate superclass, it can use the keyword `super`. This is particularly useful when a subclass wants to override a method of its superclass but still wants to call the original method.

The `super` keyword has two general forms. The first form is used to call the superclass constructor, and the second form is used to access a member of the superclass that has been hidden by a member of the subclass.

## The Implementation Logic

The implementation logic of `super` involves understanding how to use it to call superclass constructors and access superclass members.

When using `super` to call a superclass constructor, the general syntax is `super(parameter-list);`, where `parameter-list` specifies any parameters needed by the constructor in the superclass. It is essential to note that `super()` must always be the first statement executed inside a subclass constructor.

Here is an example of using `super` to initialize the attributes of a subclass:
```java
class BoxWeight extends Box {
double weight; // weight of box

// initialize width, height, and depth using super()
BoxWeight(double w, double h, double d, double m) {
super(w, h, d); // call superclass constructor
weight = m;
}
}
```
In this example, the `BoxWeight` subclass uses `super` to call the constructor of its immediate superclass, `Box`, and then initializes its own `weight` attribute.

## Failure Modes And Edge Cases

One potential failure mode when using `super` is forgetting that `super()` must be the first statement executed inside a subclass constructor. If this is not done, the code will result in a compilation error.

Another edge case to consider is when a subclass wants to access a member of its superclass that has been hidden by a member of the subclass. In this case, the subclass can use `super` to access the hidden member.

## The Proving Grounds

```interactive-quiz
[
{
"id": "q1",
"type": "code",
"schema_version": 2,
"family": "construct",
"format": "code_editor",
"variant": "write_or_explain_code",
"skill_target": "Using Super",
"question": "Write a Java subclass constructor that calls its superclass constructor using super.",
"rubric": {
"grading_mode": "rubric",
"must_include": [
"super"
]
},
"remediation": {
"misconception_codes": [
"missing_super"
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
"skill_target": "Using Super",
"question": "What is the purpose of the super keyword in Java?",
"options": {
"A": "To refer to the current object",
"B": "To refer to the immediate superclass",
"C": "To refer to a subclass"
},
"answer": "B",
"explanation": "The super keyword is used to refer to the immediate superclass of a subclass.",
"rubric": {
"grading_mode": "objective",
"must_include": []
},
"remediation": {
"misconception_codes": [
"confused_super_self"
],
"follow_up_policy": "different_family_or_format"
}
},
{
"id": "q3",
"type": "writing",
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "step_trace",
"skill_target": "Using Super",
"question": "Explain how to use super to access a hidden member of the superclass.",
"rubric": {
"grading_mode": "rubric",
"must_include": [
"super"
]
},
"remediation": {
"misconception_codes": [
"misunderstood_super_usage"
],
"follow_up_policy": "different_family_or_format"
}
}
]
```
