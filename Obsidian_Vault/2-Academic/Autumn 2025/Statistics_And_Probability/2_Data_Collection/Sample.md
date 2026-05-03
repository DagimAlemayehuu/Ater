---
title: Sample
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 12
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Population]]"
---

# 1. Mental Model
Imagine you're trying to understand the favorite ice cream flavors of all the kids in a big school. Instead of asking every single kid, you randomly pick a small group of kids, like 10 or 20, and ask them what their favorite flavors are. This small group of kids is like a `sample`, representing the bigger group of all kids in the school, which is called the `population`.

# 2. Statistical Modeling & Inference
In statistical analysis, a `sample` is a subset of individuals selected from a larger `population`, used to make inferences about the characteristics of the whole population. The process of selecting a sample involves [[Random_Sampling]] to minimize [[Selection_Bias]] and ensure that the sample is [[Representative_Sampling | Representative]] of the population. The sample size, denoted by `n`, is a critical factor in determining the precision of estimates and the power of [[Hypothesis_Testing]]. A larger sample size generally provides more accurate estimates, but it also increases the [[Sampling_Cost]].

# 3. Confounding Variables & Bias
When working with samples, it's essential to consider potential [[Confounding_Variables]] that could affect the outcome of the study. For instance, if the sample is selected from a specific subgroup of the population, it may not be representative of the entire population, leading to [[Selection_Bias]]. Additionally, [[Sampling_Frame]] errors can occur if the sample is drawn from an incomplete or inaccurate list of the population. To mitigate these issues, researchers use techniques like [[Stratified_Sampling]] and [[Weighting_Samples]] to ensure that the sample is representative of the population and that the results are generalizable.
# 4. Probability Distribution
```markdown
| Flavor        | Probability |
|---------------|-------------|
| Chocolate     | 0.3         |
| Vanilla       | 0.25        |
| Strawberry    | 0.2         |
| Cookies and Cream | 0.15      |
| Other         | 0.1         |
```

To read this table, we consider a probability distribution of favorite ice cream flavors among kids in a school. Each flavor has a corresponding probability, which represents the likelihood that a randomly selected kid prefers that flavor. For example, there's a 30% chance a kid prefers chocolate.

## 5. Walkthrough
Let's say we want to understand the favorite ice cream flavors of all 1000 kids in a school. We randomly select a sample of 50 kids and ask them about their favorite flavors. Here's how we might apply the concept of a sample:

1. **Define the Population and Sample**: The population is all 1000 kids in the school, and the sample is the 50 kids we randomly selected.

2. **Collect Data**: We ask each of the 50 kids about their favorite ice cream flavor and get the following distribution:
   - Chocolate: 15 kids
   - Vanilla: 12 kids
   - Strawberry: 10 kids
   - Cookies and Cream: 7 kids
   - Other: 6 kids

3. **Calculate Sample Proportions**: We calculate the proportion of kids in the sample who prefer each flavor.
   - Chocolate: 15/50 = 0.3
   - Vanilla: 12/50 = 0.24
   - Strawberry: 10/50 = 0.2
   - Cookies and Cream: 7/50 = 0.14
   - Other: 6/50 = 0.12

4. **Infer Population Proportions**: We use the sample proportions to make inferences about the population. For example, we might infer that approximately 30% of all kids in the school prefer chocolate.

5. **Consider Limitations**: We recognize that our sample might not perfectly represent the entire population due to random sampling error or other biases. A larger sample size would provide more precise estimates.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A sample is a subset of individuals selected from a larger population.",
    "answer": "True",
    "explanation": "This statement is true by definition of a sample in statistical analysis."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "If a researcher selects a sample of students only from a specific grade to represent all students in a school, what issue might arise?",
    "answer": "Selection Bias",
    "explanation": "The sample might not be representative of the entire school population, leading to selection bias."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how increasing the sample size affects the precision of estimates and the power of hypothesis testing. Provide an example.",
    "answer": "Increasing the sample size generally provides more accurate estimates of population parameters and increases the power of hypothesis testing. This is because a larger sample size reduces the standard error of the estimate, allowing for more precise inferences about the population. For example, if we are estimating the average height of a population, a sample size of 1000 will give a more precise estimate than a sample size of 100, assuming the same sampling method and variability in the population.",
    "explanation": "Larger samples provide more information about the population, leading to more precise estimates and greater power to detect effects."
  }
]
```