---
title: Stratified_Random_Sampling
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 28
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Random_Sampling]]"
---

# 1. Mental Model
Imagine you have a big box of different colored crayons, and you want to know what colors are most popular. Instead of picking crayons randomly from the whole box, you first separate them by color into smaller boxes. Then, you randomly pick a few crayons from each smaller box. This way, you ensure that you have a good representation of all the colors. This is similar to how Stratified Random Sampling works, where you divide your population into distinct subgroups or strata and then sample from each subgroup.

# 2. Statistical Modeling & Inference
Stratified Random Sampling is a technique used to ensure that a sample is representative of a population that can be divided into distinct subgroups or strata. The process involves [[Stratification]] of the population into mutually exclusive and exhaustive subgroups, followed by the application of [[Simple Random Sampling]] within each stratum. This approach allows for more precise estimates of population parameters by reducing [[Sampling_Variance]]. The strata are often defined based on characteristics that are relevant to the research question, such as age, sex, or socioeconomic status. By doing so, the sample can provide more accurate insights into the population, especially when there are significant differences between the strata.

# 3. Confounding Variables & Bias
When using Stratified Random Sampling, it's crucial to identify the correct strata to ensure that the sample accurately represents the population. If the strata are not properly defined, it can lead to [[Selection_Bias]], where certain subgroups are over- or underrepresented. Additionally, if there are [[Confounding_Variables]] that are not accounted for in the stratification process, it can lead to biased estimates of population parameters. For instance, if a researcher is studying the effect of education level on income and fails to stratify by age, the sample may be biased towards older individuals who have had more time to complete their education. Therefore, careful consideration must be given to the selection of strata to minimize bias and ensure the validity of the results.
# 4. Probability Distribution
```markdown
| Stratification  | Sample Size | Probability of Selection |
| ---             | ---         | ---                     |
| Stratum 1       | 100         | 0.2                     |
| Stratum 2       | 200         | 0.4                     |
| Stratum 3       | 300         | 0.4                     |
```
To read this table, we consider a population divided into three strata. The sample size for each stratum is given, along with the probability of selection for each stratum. For instance, Stratum 1 has a sample size of 100 and a probability of selection of 0.2, meaning that 20% of the sample comes from Stratum 1.

## 5. Walkthrough
Suppose we are conducting a survey to estimate the average income of a population of 10,000 individuals, which can be divided into three strata based on age: 18-24, 25-44, and 45-64. The population sizes for each stratum are 2,000, 4,000, and 4,000, respectively.

1. **Define the strata and their population sizes**:
   - Stratum 1 (18-24): 2,000
   - Stratum 2 (25-44): 4,000
   - Stratum 3 (45-64): 4,000

2. **Determine the sample size for each stratum**:
   We decide on a total sample size of 1,000. To ensure representation, we allocate the sample size proportionally to the population size of each stratum.
   - Sample size for Stratum 1: (2,000 / 10,000) * 1,000 = 200
   - Sample size for Stratum 2: (4,000 / 10,000) * 1,000 = 400
   - Sample size for Stratum 3: (4,000 / 10,000) * 1,000 = 400

3. **Calculate the probability of selection for each stratum**:
   - Probability for Stratum 1: 200 / 2,000 = 0.1
   - Probability for Stratum 2: 400 / 4,000 = 0.1
   - Probability for Stratum 3: 400 / 4,000 = 0.1

4. **Perform simple random sampling within each stratum**:
   We randomly select 200 individuals from Stratum 1, 400 from Stratum 2, and 400 from Stratum 3.

5. **Estimate the population parameter**:
   We calculate the average income for each stratum and then compute the overall average income for the population, weighted by the population size of each stratum.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Stratified Random Sampling involves sampling from the entire population without any stratification.",
    "answer": "False",
    "explanation": "Stratified Random Sampling involves dividing the population into distinct subgroups or strata and then sampling from each stratum."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher wants to study the effect of exercise on blood pressure. The population consists of 1,000 individuals, with 400 being athletes, 300 being moderately active, and 300 being sedentary. If the researcher wants to sample 100 individuals, how would they allocate the sample size using Stratified Random Sampling?",
    "answer": "The researcher would allocate the sample size as follows: 40 athletes (400/1000 * 100), 30 moderately active (300/1000 * 100), and 30 sedentary (300/1000 * 100).",
    "explanation": "This ensures that each subgroup is represented in the sample, allowing for more accurate insights into the effect of exercise on blood pressure across different activity levels."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how Stratified Random Sampling can help reduce bias in estimating the average salary of employees in a company that has different departments (e.g., engineering, marketing, sales).",
    "answer": "Stratified Random Sampling can help reduce bias by ensuring that each department is represented in the sample. This is achieved by stratifying the population by department and then sampling from each stratum. By doing so, the sample will have a more accurate representation of the salary distribution across different departments, reducing the risk of over- or underrepresentation of any particular department. This approach helps in minimizing selection bias and provides more precise estimates of the average salary.",
    "explanation": "This approach is crucial in scenarios where there are significant differences in salaries across departments, and a simple random sample might not capture these variations accurately."
  }
]
```