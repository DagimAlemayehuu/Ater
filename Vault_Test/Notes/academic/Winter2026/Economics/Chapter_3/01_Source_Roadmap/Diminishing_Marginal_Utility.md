---
title: "Diminishing_Marginal_Utility"
hub: "[[Chapter_3_Hub]]"
source: "[[Chapter 3 2024-1.pdf]]"
source_file: "Inbox/generated/academic/Chapter 3 2024-1.pdf"
source_pages: [14]
source_job_id: "srcjob_a695e6c9d95e4713"
domain: "ECON-MICRO"
concept_modality: "Quantitative"
fallback_generation: false
generated_by: "ater_source_job"
ai_provider: "groq"
ai_model: "meta-llama/llama-4-scout-17b-16e-instruct"
---
## Mental Model
The concept of Diminishing Marginal Utility (DMU) is crucial in understanding consumer behavior in microeconomics. It states that as a consumer consumes more units of a good, the additional satisfaction they derive from each subsequent unit decreases.

## The Economic Intuition
The economic intuition behind DMU is that as a consumer consumes more of a good, the marginal utility they derive from each additional unit decreases. This is because the consumer's desire for the good is satisfied to some extent with each additional unit consumed. For example, if a person is thirsty and drinks a glass of water, the satisfaction they derive from that first glass is high. However, if they drink a second glass, the satisfaction they derive from that second glass is lower than the first, and if they drink a third glass, the satisfaction they derive from that third glass is even lower.

## The Calculation Logic
To calculate diminishing marginal utility, we can use the following steps:

- Calculate the total utility derived from consuming a certain number of units of a good.
- Calculate the marginal utility derived from each additional unit consumed by finding the difference in total utility between two consecutive units.
- Observe how the marginal utility decreases as the consumer consumes more units.

For instance, let's assume a consumer derives the following total utilities from consuming units of a good:

| Units Consumed | Total Utility |
| --- | --- |
| 1 | 10 |
| 2 | 18 |
| 3 | 24 |
| 4 | 28 |

The marginal utilities are:

| Units Consumed | Marginal Utility |
| --- | --- |
| 1 | 10 |
| 2 | 8 |
| 3 | 6 |
| 4 | 4 |

## The Formal Math & Models
The formal mathematical representation of diminishing marginal utility can be expressed as follows:

Let $TU$ be the total utility and $Q$ be the quantity of the good consumed. The marginal utility ($MU$) is the derivative of total utility with respect to quantity:

\[ MU = \frac{d(TU)}{dQ} \]

For diminishing marginal utility, we have:

\[ \frac{d(MU)}{dQ} < 0 \]

This implies that as $Q$ increases, $MU$ decreases.

## The Proving Grounds
```interactive-quiz
[
{
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "calculation_or_derivation",
"skill_target": "Diminishing Marginal Utility",
"question": "Calculate the marginal utilities and determine if the utility function exhibits diminishing marginal utility.",
"table": {
"headers": [
"Units Consumed",
"Total Utility"
],
"rows": [
[
1,
10
],
[
2,
18
],
[
3,
24
],
[
4,
28
]
]
},
"rubric": {
"grading_mode": "objective",
"must_include": [
"correct marginal utilities"
]
},
"remediation": {
"misconception_codes": [
"incorrect_calculation"
],
"follow_up_policy": "different_family_or_format"
},
"type": "writing"
},
{
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "evidence_interpretation",
"skill_target": "Diminishing Marginal Utility",
"question": "What does it mean for a good to have diminishing marginal utility?",
"answer": "As a consumer consumes more units of a good, the additional satisfaction they derive from each subsequent unit decreases.",
"rubric": {
"grading_mode": "rubric",
"must_include": [
"definition"
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
"variant": "step_trace",
"skill_target": "Diminishing Marginal Utility",
"question": "Derive the marginal utility for each unit consumed given a total utility function TU = 10Q - Q^2.",
"rubric": {
"grading_mode": "hybrid",
"must_include": [
"correct_derivation"
]
},
"remediation": {
"misconception_codes": [
"incorrect_derivation"
],
"follow_up_policy": "different_family_or_format"
},
"type": "writing"
}
]
```
