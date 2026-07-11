---
title: "Consumers_Income"
hub: "[[Chapter_3_Hub]]"
source: "[[Chapter 3 2024-1.pdf]]"
source_file: "Inbox/generated/academic/Chapter 3 2024-1.pdf"
source_pages: [46]
source_job_id: "srcjob_a695e6c9d95e4713"
domain: "ECON-MICRO"
concept_modality: "Quantitative"
fallback_generation: false
generated_by: "ater_source_job"
ai_provider: "groq"
ai_model: "meta-llama/llama-4-scout-17b-16e-instruct"
---
## Mental Model
The budget line, a fundamental concept in microeconomics, represents the various combinations of two goods that a consumer can purchase given their income and the prices of the goods. Understanding how the budget line changes in response to different factors is crucial for analyzing consumer behavior.

## The Economic Intuition
The budget line changes when there is a shift in one of its determinants. There are three primary determinants:
1. The consumer's income: An increase in income allows the consumer to buy more goods, shifting the budget line outward (or to the right), while a decrease in income shifts it inward (or to the left).
2. The prices of goods: A decrease in the price of one good makes it cheaper, effectively increasing the consumer's purchasing power for that good and shifting the budget line outward along the axis representing that good. Conversely, an increase in price reduces purchasing power and shifts the budget line inward along that axis.
3. Taxes, subsidies, and rationing: These factors can also affect the consumer's effective income or the prices they pay for goods, thereby influencing the budget line.

## The Calculation Logic
The equation of the budget line can be represented as \(P_1Q_1 + P_2Q_2 = I\), where \(P_1\) and \(P_2\) are the prices of the two goods, \(Q_1\) and \(Q_2\) are the quantities of the two goods, and \(I\) is the consumer's income.
- When income (\(I\)) changes, the entire budget line shifts. For example, if income increases, both the intercepts on the axes change, allowing for more of both goods to be purchased.
- When the price of a good changes, the slope of the budget line changes, which means the intercepts on the axes change. For instance, if \(P_1\) decreases, the budget line becomes flatter.

## The Formal Math & Models
The budget line is formally expressed as:
\[I = P_1Q_1 + P_2Q_2\]
Or in slope-intercept form:
\[Q_2 = \frac{I}{P_2} - \frac{P_1}{P_2}Q_1\]
The slope of the budget line is \(-\frac{P_1}{P_2}\), and the intercepts are \(\frac{I}{P_1}\) and \(\frac{I}{P_2}\) on the \(Q_1\) and \(Q_2\) axes, respectively.

## The Proving Grounds
```interactive-quiz
[
{
"schema_version": 2,
"family": "recognize",
"format": "choice",
"variant": "source_grounded_choice",
"skill_target": "Consumers Income",
"question": "What happens to the budget line when a consumer's income increases?",
"options": {
"A": "It shifts inward.",
"B": "It shifts outward.",
"C": "It becomes steeper.",
"D": "It becomes flatter."
},
"answer": "B",
"explanation": "An increase in income allows the consumer to buy more goods, shifting the budget line outward.",
"rubric": {
"grading_mode": "objective",
"must_include": []
},
"remediation": {
"misconception_codes": [
"increased_income_decreases_purchasing_power"
],
"follow_up_policy": "different_family_or_format"
},
"type": "mcq"
},
{
"schema_version": 2,
"family": "explain",
"format": "short_text",
"variant": "mechanism_explanation",
"skill_target": "Consumers Income",
"question": "Explain how a decrease in the price of one good affects the budget line.",
"answer": "A decrease in the price of one good increases the consumer's purchasing power for that good, causing the budget line to shift outward along the axis of that good.",
"explanation": "This is because the consumer can now buy more of that good with the same amount of income.",
"rubric": {
"grading_mode": "rubric",
"must_include": [
"correct_direction_of_shift"
]
},
"remediation": {
"misconception_codes": [
"price_decrease_reduces_purchasing_power"
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
"skill_target": "Consumers Income",
"question": "If a consumer's income is $100, and the prices of goods X and Y are $5 and $10 respectively, what is the maximum amount of good X the consumer can buy if they spend all their income on X?",
"answer": "20",
"explanation": "The maximum amount of good X the consumer can buy is $100 / $5 = 20 units.",
"rubric": {
"grading_mode": "objective",
"must_include": [
"correct_calculation"
]
},
"remediation": {
"misconception_codes": [
"calculation_error"
],
"follow_up_policy": "different_family_or_format"
},
"type": "writing"
}
]
```
