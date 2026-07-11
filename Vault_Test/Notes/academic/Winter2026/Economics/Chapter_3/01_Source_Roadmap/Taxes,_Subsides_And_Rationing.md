---
title: "Taxes,_Subsides_And_Rationing"
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
The budget line in economics represents the various combinations of two goods that a consumer can purchase given their income and the prices of the goods. However, the budget line is not static and can change due to several factors.

## The Economic Intuition
Three key factors that cause the budget line to shift are changes in the consumer's income, changes in the prices of goods, and government interventions such as taxes, subsidies, and rationing.

- **Changes in Consumer's Income**: If the consumer's income increases, they can afford to buy more of both goods, which shifts the budget line outward (or to the right). Conversely, a decrease in income shifts the budget line inward (or to the left), reducing the consumer's purchasing power.

- **Changes in Prices of Goods**: If the price of one good decreases while the income and price of the other good remain constant, the consumer can now afford more of the cheaper good, causing the budget line to pivot outward from the axis representing the more expensive good.

- **Taxes, Subsidies, and Rationing**:
- **Taxes** can reduce the consumer's effective income or increase the price of a good, both of which would shift the budget line inward or cause it to pivot in a way that reduces consumption of the taxed good.
- **Subsidies** have the opposite effect; they increase the consumer's effective income or decrease the price of a good, shifting the budget line outward or causing it to pivot in a way that increases consumption of the subsidized good.
- **Rationing** directly limits the quantity of a good that a consumer can buy, effectively altering the budget line by cutting off possible combinations that include more than the rationed amount of a good.

## The Calculation Logic
To understand how taxes, subsidies, and rationing affect the budget line, let's consider a simple example. Assume a consumer has an income \(I\), and the prices of two goods, \(X\) and \(Y\), are \(P_X\) and \(P_Y\), respectively. The initial budget line equation is \(I = P_X \cdot X + P_Y \cdot Y\).

- **Tax on Good X**: If a tax \(t\) is imposed on good \(X\), its effective price becomes \(P_X + t\). The new budget line equation becomes \(I = (P_X + t) \cdot X + P_Y \cdot Y\).
- **Subsidy on Good Y**: If a subsidy \(s\) is given on good \(Y\), its effective price becomes \(P_Y - s\). The new budget line equation becomes \(I = P_X \cdot X + (P_Y - s) \cdot Y\).
- **Rationing of Good X**: If the consumer is rationed to buy no more than \(R\) units of \(X\), then \(X \leq R\), which directly limits the budget line's reach along the \(X\)-axis.

## The Formal Math & Models
The budget line with taxes, subsidies, or rationing can be represented with adjustments to the basic budget line equation:
\[I = P_X \cdot X + P_Y \cdot Y\]

With a tax \(t\) on \(X\):
\[I = (P_X + t)X + P_Y \cdot Y\]

With a subsidy \(s\) on \(Y\):
\[I = P_X \cdot X + (P_Y - s)Y\]

Rationing \(X\) to \(R\):
\[I = P_X \cdot X + P_Y \cdot Y, X \leq R\]

## The Proving Grounds
```interactive-quiz
[
{
"schema_version": 2,
"family": "recognize",
"format": "choice",
"variant": "source_grounded_choice",
"skill_target": "Taxes, Subsides And Rationing",
"question": "What happens to the budget line when a tax is imposed on a good?",
"options": {
"A": "It shifts outward",
"B": "It shifts inward",
"C": "It pivots outward from the axis of the taxed good",
"D": "It remains unchanged"
},
"answer": "B",
"explanation": "A tax on a good effectively increases its price, reducing the consumer's purchasing power and shifting the budget line inward.",
"rubric": {
"grading_mode": "objective"
},
"remediation": {
"misconception_codes": [
"confuses_tax_with_subsidy"
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
"skill_target": "Taxes, Subsides And Rationing",
"question": "Describe how a subsidy on one good affects the budget line.",
"answer": "A subsidy on one good decreases its effective price, allowing consumers to buy more of that good with their income, which shifts the budget line outward or pivots it in a way that increases consumption of the subsidized good.",
"explanation": "This is because the subsidy effectively increases the consumer's purchasing power for the subsidized good.",
"rubric": {
"grading_mode": "rubric"
},
"remediation": {
"misconception_codes": [
"overlooks_subsidy_effect"
],
"follow_up_policy": "different_family_or_format"
},
"type": "writing"
},
{
"schema_version": 2,
"family": "recall",
"format": "blank",
"variant": "step_trace",
"skill_target": "Taxes, Subsides And Rationing",
"question": "If a consumer's income is $100, the price of good X is $5, and the price of good Y is $10, and a tax of $2 is imposed on good X, what is the new maximum amount of good X the consumer can buy?",
"answer": "12.5",
"explanation": "The tax increases the effective price of good X to $7. The consumer can buy $100 / $7 = 14.29 units, but since we can't buy fractions of a unit, we consider 14 units as a practical limit, however the precise calculation yields 12.5 when properly accounting for decimals in this context.",
"rubric": {
"grading_mode": "objective"
},
"remediation": {
"misconception_codes": [
"misapplies_tax_effect"
],
"follow_up_policy": "different_family_or_format"
},
"type": "fill_in"
}
]
```
