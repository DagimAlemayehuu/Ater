---
title: "Case_Of_N-_Commodities"
hub: "[[Chapter_3_Hub]]"
source: "[[Chapter 3 2024-1.pdf]]"
source_file: "Inbox/generated/academic/Chapter 3 2024-1.pdf"
source_pages: [21]
source_job_id: "srcjob_a695e6c9d95e4713"
domain: "ECON-MICRO"
concept_modality: "Quantitative"
fallback_generation: false
generated_by: "ater_source_job"
ai_provider: "groq"
ai_model: "meta-llama/llama-4-scout-17b-16e-instruct"
---
## Mental Model
The concept of the Case of N-Commodities is an extension of consumer equilibrium theory in microeconomics. It explains how a consumer allocates their income among various goods and services to maximize their utility. The theory assumes that consumers make rational decisions based on their preferences and budget constraints.

## The Economic Intuition
In a market with multiple commodities, consumers face a multitude of choices. The economic intuition behind the Case of N-Commodities is that consumers will allocate their income in a way that maximizes their overall satisfaction or utility. This is achieved by equating the marginal utility of each good to its price. When the marginal utility per dollar spent is equal across all goods, the consumer is in equilibrium.

## The Calculation Logic
To find the equilibrium, we use the formula for the Case of n-commodities:

\[ \frac{MU_1}{P_1} = \frac{MU_2}{P_2} = \frac{MU_3}{P_3} = \cdots = \frac{MU_n}{P_n} \]

Here, \(MU_i\) represents the marginal utility of good \(i\), and \(P_i\) represents its price. This equation implies that the consumer allocates their budget so that the last dollar spent on each good provides the same marginal utility.

## The Formal Math & Models
The formal model for the Case of N-Commodities involves maximizing a utility function subject to a budget constraint. The utility function \(U\) is a function of the quantities of \(n\) goods:

\[ U = U(x_1, x_2, \ldots, x_n) \]

Subject to the budget constraint:

\[ P_1x_1 + P_2x_2 + \cdots + P_nx_n = I \]

Where \(x_i\) is the quantity of good \(i\), \(P_i\) is its price, and \(I\) is the consumer's income. The solution to this optimization problem yields the demand functions for each good.

## The Proving Grounds
```interactive-quiz
[
{
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "calculation_or_derivation",
"skill_target": "Case Of N- Commodities",
"question": "Given a consumer with income $100, and two goods X and Y with prices $5 and $10 respectively, and marginal utilities of 10 and 20 respectively, find the optimal allocation.",
"rubric": {
"grading_mode": "objective",
"must_include": [
"correct calculation"
]
},
"remediation": {
"misconception_codes": [
"misapplication_of_formula"
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
"skill_target": "Case Of N- Commodities",
"question": "If a consumer's marginal utility per dollar spent on good A is greater than that of good B, what should they do to maximize utility?",
"rubric": {
"grading_mode": "rubric",
"must_include": [
"correct interpretation"
]
},
"remediation": {
"misconception_codes": [
"incorrect_interpretation"
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
"skill_target": "Case Of N- Commodities",
"question": "Derive the demand function for a consumer with a utility function U(x,y) = xy, subject to a budget constraint 5x + 10y = 100.",
"rubric": {
"grading_mode": "hybrid",
"must_include": [
"correct derivation"
]
},
"remediation": {
"misconception_codes": [
"derivation_error"
],
"follow_up_policy": "different_family_or_format"
},
"type": "writing"
}
]
```
