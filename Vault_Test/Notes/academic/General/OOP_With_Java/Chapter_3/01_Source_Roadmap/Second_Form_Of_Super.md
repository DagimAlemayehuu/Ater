---
title: "Second_Form_Of_Super"
hub: "[[Chapter_3_Hub]]"
source: "[[Chapter 3.pdf]]"
source_file: "Inbox/generated/academic/Chapter 3.pdf"
source_pages: [30]
source_job_id: "srcjob_4c9f3ed7e6c744f4"
domain: "CS-SOFTWARE"
concept_modality: "Qualitative/Definitional"
fallback_generation: false
generated_by: "ater_source_job"
ai_provider: "groq"
ai_model: "meta-llama/llama-4-scout-17b-16e-instruct"
---
## Mental Model

The concept of the second form of `super` in object-oriented programming is essential for understanding how to access and manipulate members (methods or instance variables) from a superclass when they are hidden by a subclass with the same name.

## The Working Intuition

The second form of `super`, denoted as `super.member`, allows you to access a member (either a method or an instance variable) from a superclass when that member's name is hidden by a subclass. This situation often arises in inheritance scenarios where a subclass inadvertently hides a member from its superclass by declaring a member with the same name. The use of `super.member` helps in explicitly referring to the superclass's member, thereby avoiding confusion and ensuring the correct member is accessed or modified.

## The Implementation Logic

When implementing the second form of `super`, consider a simple example based on the provided excerpt:

```java
class A {
int i;
}

class B extends A {
int i; // This i hides the i in A

B(int a, int b) {
super.i = a; // Refers to i in A
i = b; // Refers to i in B
}
}
```

In this example, `super.i` is used to access the `i` from class `A`, while `i` (without `super`) refers to the `i` in class `B`. This distinction is crucial for correctly initializing or manipulating the hidden members.

## Failure Modes And Edge Cases

One common failure mode when using the second form of `super` is misunderstanding the scope and visibility of members across classes. For instance, if a subclass does not have a member with the same name as one in its superclass, using `super` to access that member is unnecessary and could lead to confusion. Additionally, if the superclass's member is private, it cannot be accessed directly using `super` from a subclass, highlighting the importance of understanding access modifiers in object-oriented programming.

## The Proving Grounds

```interactive-quiz
[
{
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "write_or_explain_code",
"skill_target": "Second Form Of Super",
"question": "Complete the code to use the second form of super to access and set the superclass's 'x' variable.",
"rubric": {
"grading_mode": "rubric",
"must_include": [
"super"
]
},
"remediation": {
"misconception_codes": [
"syntax_error"
],
"follow_up_policy": "different_family_or_format"
},
"code": {
"superclass": "class A { int x; }",
"subclass": "class B extends A { int x; B(int val) { ______ } }"
},
"hint": "Use super to set the superclass's x variable.",
"type": "writing"
},
{
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "step_trace",
"skill_target": "Second Form Of Super",
"question": "Explain why we might prefer to use the second form of super when accessing hidden members.",
"rubric": {
"grading_mode": "objective",
"must_include": [
"ambiguity",
"clarity"
]
},
"remediation": {
"misconception_codes": [
"explanation_error"
],
"follow_up_policy": "different_family_or_format"
},
"type": "writing"
}
]
```
