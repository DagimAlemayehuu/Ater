---
title: Sample_Frame_Error
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 16
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Sampling_Error]]"
---

# 1. Mental Model
Imagine you're trying to understand the favorite ice cream flavors of all students in a school, but instead of getting a list of all students, you only get a list of students in one classroom. If you only survey the students in that one classroom, you might get a skewed view of what the whole school likes, because that classroom might have a lot of students who love a particular flavor that isn't as popular school-wide. This is similar to a Sample Frame Error, where the group you're sampling from (the classroom) doesn't accurately represent the whole population you're interested in (the entire school).

# 2. Statistical Modeling & Inference
Sample Frame Error occurs when the [[Sampling_Frame]] used to select a sample does not match the [[Target_Population]], leading to a biased sample. This error arises because the sample selected may not be [[Representative_Sampling]], meaning it may not accurately reflect the characteristics of the target population. Mechanically, this error affects the [[Generalizability]] of the findings, making it challenging to infer results from the sample to the target population. For instance, if a researcher aims to study the average income of a city's residents but samples only from a neighborhood with higher-than-average incomes, the sample frame error would lead to an overestimation of the city's average income.

# 3. Confounding Variables & Bias
The presence of Sample Frame Error introduces [[Selection_Bias]] into the study, as the sample is not selected with [[Probability_Sampling]] methods that would ensure every member of the target population has an equal chance of being selected. This type of bias can be particularly problematic because it can lead to [[Non_Response_Bias]] and [[Measurement_Bias]], further complicating the analysis. Boundary conditions, such as an incorrectly defined target population or an outdated sampling frame, can exacerbate Sample Frame Error. Failure states include incorrect inferences about the target population, potentially leading to misguided decisions. Constraints, such as limited resources or access to accurate population data, can limit the ability to minimize Sample Frame Error.
# 4. Probability Distribution
```markdown
|  | Predicted Favorite Ice Cream Flavor | 
| --- | --- |
| **Actual Favorite Flavor** | Chocolate | Vanilla | Strawberry | 
| **Chocolate** | 0.8 | 0.1 | 0.1 |
| **Vanilla** | 0.2 | 0.7 | 0.1 |
| **Strawberry** | 0.1 | 0.2 | 0.7 |
```
To read this confusion matrix: the rows represent the actual favorite ice cream flavors of students in the entire school, and the columns represent the predicted favorite flavors based on a sample with a Sample Frame Error (e.g., only surveying one classroom). The cell at row `i` and column `j` contains the probability that a student with actual favorite flavor `i` is predicted to have favorite flavor `j`. For instance, there's an 80% chance that a student who actually prefers chocolate will be predicted to prefer chocolate based on the biased sample.

## 5. Walkthrough
Here's a step-by-step scenario applying the concept of Sample Frame Error:

1. **Define the Target Population and Sampling Frame**: The target population is all 1000 students in a school. However, due to convenience, the sampling frame used is only the 50 students in the math club.

2. **Identify the Issue**: The sampling frame (math club students) may not be representative of the entire school population. For instance, math club students might have a higher proportion of students who prefer chocolate ice cream.

3. **Collect Data**: A survey is conducted among the 50 math club students, and it's found that 60% prefer chocolate, 30% prefer vanilla, and 10% prefer strawberry.

4. **Analyze Data with Sample Frame Error**: If we incorrectly assume that the 50 math club students represent the entire school, we would estimate that 60% of all students prefer chocolate, 30% prefer vanilla, and 10% prefer strawberry.

5. **Consider the Impact**: Given that the math club might skew towards students with a particular interest (and potentially a particular ice cream preference), the actual preferences of the entire school might be different. For example, the true distribution might be 50% chocolate, 40% vanilla, and 10% strawberry.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Sample Frame Error occurs when the sample selected is representative of the target population.",
    "answer": "False",
    "explanation": "Sample Frame Error occurs when the sample selected is not representative of the target population."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher aims to study the average income of a city's residents but samples only from a neighborhood with higher-than-average incomes. What type of error is this an example of?",
    "answer": "Sample Frame Error",
    "explanation": "This is an example of Sample Frame Error because the sampling frame (residents of a specific neighborhood) does not match the target population (all city residents), leading to a biased sample."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how Sample Frame Error can lead to incorrect inferences about a target population and provide an example.",
    "answer": "Sample Frame Error can lead to incorrect inferences about a target population because it results in a sample that is not representative of the population. For example, if a researcher wants to know the favorite sports of all high school students in a state but only surveys students from a single school that has a strong sports program, the sample may overrepresent students who are particularly interested in sports, leading to incorrect inferences about the preferences of high school students statewide.",
    "explanation": "This question requires the application of Sample Frame Error to a scenario and explanation of its implications."
  }
]
```