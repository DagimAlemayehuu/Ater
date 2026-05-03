---
title: Selection_Error
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
Imagine you're at a school bake sale, and only the students who love baking and want to sell their treats show up. This doesn't give a fair idea of what all students in the school think about the bake sale. Similarly, in surveys, selection error happens when the people who choose to participate aren't representative of the whole group, leading to biased results.

# 2. Statistical Modeling & Inference
Selection error arises in surveys when the sample isn't representative of the population due to [[Non_Response_Bias]] and [[Self_Selection_Bias]]. Mechanically, this occurs because the process of selecting participants isn't controlled, allowing individuals with specific interests or characteristics to opt-in or opt-out, thereby skewing the results. In statistical modeling, this can lead to [[Model_Omissibility]] issues, where the model fails to account for the selection process, resulting in biased parameter estimates. For instance, if a survey about a new product only attracts tech enthusiasts, the results might overestimate market demand. To address this, researchers use techniques like [[Inverse_Probability_Weighting]] to adjust for the selection bias.

# 3. Confounding Variables & Bias
The boundary conditions for selection error include scenarios where the survey's mode of administration or its design inadvertently discourages certain groups from participating, leading to an underrepresentation of those groups. Failure states include [[Type_I_Error]] and [[Type_Ii_Error]], where the former involves incorrectly rejecting a true null hypothesis and the latter involves failing to reject a false null hypothesis, both of which can be exacerbated by selection error. Constraints in survey research, such as limited resources or [[Social_Desirability_Bias]], can exacerbate selection error by making it difficult to implement robust sampling frames or achieve high response rates across diverse subgroups. Understanding these dynamics is crucial for mitigating selection error and ensuring the validity of survey inferences.
# 4. Probability Distribution
```markdown
|  | Predicted Positive | Predicted Negative | Total |
| --- | --- | --- | --- |
| Actual Positive | 80 | 20 | 100 |
| Actual Negative | 30 | 70 | 100 |
| Total | 110 | 90 | 200 |
```
To read this confusion matrix: The table shows the predicted outcomes versus actual outcomes for a given scenario. For instance, 80 individuals who were actually positive were correctly predicted as positive, while 20 who were actually positive were predicted as negative.

## 5. Walkthrough
Let's walk through a scenario where selection error could occur:

1. **Scenario Setup**: A tech company wants to gauge interest in a new smartphone feature. They conduct an online survey that is advertised on tech forums and social media.

2. **Data Collection**: The survey attracts 1,000 respondents, all of whom are active on tech forums and social media.

3. **Analysis Initiation**: Initial analysis suggests a high level of interest in the feature, with 80% of respondents indicating they would use it.

4. **Recognizing Selection Error**: However, it's noted that the respondents are predominantly young adults (18-35) who are tech-savvy. This group might not represent the broader population, which includes a wider age range and varying levels of tech engagement.

5. **Addressing Selection Error**: To adjust for this, the company decides to use inverse probability weighting. They assign higher weights to responses from older adults and those less active on tech forums, assuming these groups are underrepresented.

6. **Re-analysis**: After applying the weights, the interest rate drops to 60%. This suggests the initial analysis overestimated interest due to selection error.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Selection error occurs when the sample in a survey is representative of the population.",
    "answer": "False",
    "explanation": "Selection error happens when the sample isn't representative of the population."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A university conducts a survey on campus parking issues but only advertises it in the student union and on student social media. What type of error is likely to occur and how might it affect the results?",
    "answer": "Selection error is likely to occur. The results might overrepresent the views of students who are active in the student union or on social media, potentially missing the perspectives of less active or commuter students.",
    "explanation": "This scenario describes a situation prone to selection error because the method of advertising the survey may exclude certain groups of students."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how selection error could affect the outcomes of a survey about environmental concerns, where the survey is conducted at an environmental rally. Propose a method to mitigate this error.",
    "answer": "Selection error could lead to an overestimation of environmental concerns because the survey is conducted at an environmental rally, attracting individuals who are more likely to be concerned about environmental issues. To mitigate this, the survey could use inverse probability weighting to adjust for the overrepresentation of environmentally conscious individuals.",
    "explanation": "Conducting a survey at an environmental rally introduces selection error because it biases the sample towards individuals with strong environmental concerns."
  }
]
```