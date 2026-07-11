---
title: "Budget_Set"
hub: "[[Chapter_3_Hub]]"
source: "[[Chapter 3 2024-1.pdf]]"
source_file: "Inbox/generated/academic/Chapter 3 2024-1.pdf"
source_pages: [43]
source_job_id: "srcjob_a695e6c9d95e4713"
domain: "ECON-MICRO"
concept_modality: "Quantitative"
fallback_generation: false
generated_by: "ater_source_job"
ai_provider: "groq"
ai_model: "meta-llama/llama-4-scout-17b-16e-instruct"
---
## Mental Model
The budget set is a fundamental concept in microeconomics that represents all the possible combinations of goods and services that a consumer can afford given their income and the prices of the goods. It is essential to understand how the budget set is defined and how it changes in response to changes in income and prices.

## The Economic Intuition
The economic intuition behind the budget set is that consumers have limited income and face prices for the goods and services they want to buy. The budget set shows the various combinations of goods that a consumer can purchase given these constraints. For example, if a consumer has a monthly income of $100 and wants to buy two goods, X and Y, with prices $10 and $20 respectively, the budget set will show all the possible combinations of X and Y that the consumer can afford with their $100.

## The Calculation Logic
To calculate the budget set, we need to know the consumer's income (M) and the prices of the goods (Px and Py). The budget line, which is the boundary of the budget set, can be calculated using the equation: Px * X + Py * Y = M. This equation shows that the total expenditure on goods X and Y must equal the consumer's income. By rearranging this equation, we can solve for Y in terms of X, which gives us the slope of the budget line.

## The Formal Math & Models
The budget set can be represented formally using the following equation:
$$
\begin{aligned}
P_xX + P_yY &\leq M \\
\end{aligned}
$$
The budget line is given by:
$$
\begin{aligned}
P_xX + P_yY &= M \\
\end{aligned}
$$
The slope of the budget line is given by:
$$
\begin{aligned}
Y &= \frac{M}{P_y} - \frac{P_x}{P_y}X \\
\end{aligned}
$$

## The Proving Grounds
```interactive-quiz
[
{
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "calculation_or_derivation",
"skill_target": "Budget Set",
"rubric": {
"grading_mode": "objective",
"must_include": []
},
"remediation": {
"misconception_codes": [
"incorrect_calculation"
],
"follow_up_policy": "different_family_or_format"
},
"question": "Given that a consumer's income is $100, and the prices of goods X and Y are $10 and $20 respectively, fill in the table with the affordable combinations of X and Y.",
"rows": [
{
"X": "",
"Y": ""
},
{
"X": "",
"Y": ""
}
],
"type": "writing"
},
{
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "evidence_interpretation",
"skill_target": "Budget Set",
"rubric": {
"grading_mode": "rubric",
"must_include": []
},
"remediation": {
"misconception_codes": [
"misinterpretation_of_budget_line"
],
"follow_up_policy": "different_family_or_format"
},
"question": "What happens to the budget set if the price of good X increases to $15, assuming all else remains constant?",
"type": "writing"
},
{
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "step_trace",
"skill_target": "Budget Set",
"rubric": {
"grading_mode": "hybrid",
"must_include": []
},
"remediation": {
"misconception_codes": [
"incomplete_trace"
],
"follow_up_policy": "different_family_or_format"
},
"question": "Derive the budget line for a consumer with an income of $120, and the prices of goods X and Y are $12 and $24 respectively.",
"type": "writing"
}
]
```
