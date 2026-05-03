---
title: Cost_Effectiveness_of_Questionnaires
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 91
mode: MATH-STAT
read: false
generated: true
---

# 1. Mental Model
Imagine you're a librarian trying to catalog every book in a huge library across an entire city. You could visit each library in person and ask every librarian about their books (like a face-to-face interview), but that would take a lot of time and money. Instead, you could send a simple form (like a questionnaire) to every library and have them fill it out, which would be much faster and cheaper. This analogy illustrates how questionnaires can be a cost-effective way to collect data, especially when dealing with large populations or areas.

# 2. Statistical Modeling & Inference
The cost effectiveness of questionnaires can be understood through the lens of [[Survey_Sampling]] and [[Statistical_Efficiency]]. When designing a study, researchers aim to achieve the desired level of [[Precision]] while minimizing costs. Questionnaires allow for the collection of data from a large number of participants with relatively low costs per respondent, making them an attractive option for studies requiring large sample sizes. The use of [[Asymptotic_Theory]] also supports the cost effectiveness of questionnaires, as the sample size increases, the estimates become more precise, and the cost per respondent decreases. By leveraging these statistical concepts, researchers can efficiently allocate resources and achieve reliable results.

# 3. Confounding Variables & Bias
However, the cost effectiveness of questionnaires can be influenced by several confounding variables, such as [[Non_Response_Bias]] and [[Measurement_Error]]. If certain groups of respondents are more likely to not respond to the questionnaire, the resulting sample may not be representative of the population, leading to biased estimates. Additionally, the quality of the questionnaire itself can affect the accuracy of the responses, with poorly designed questions leading to [[Social_Desirability_Bias]] or [[Response_Fatigue]]. To mitigate these risks, researchers must carefully design and pilot-test their questionnaires to ensure they are effective and reliable. By acknowledging and addressing these potential biases, researchers can increase the validity and cost effectiveness of their questionnaire-based studies.
# 4. Probability Distribution
```markdown
| Predicted Outcome | Actual Positive | Actual Negative |
| --- | --- | --- |
| Predicted Positive | 80 (TP) | 20 (FP) |
| Predicted Negative | 10 (FN) | 90 (TN) |
```

This confusion matrix shows the relationship between predicted outcomes and actual outcomes for a given questionnaire. To read it, look at the true positives (TP), false positives (FP), false negatives (FN), and true negatives (TN) to understand the accuracy of the questionnaire's predictions.

## 5. Walkthrough
Let's say we're conducting a study to evaluate the effectiveness of a new health questionnaire in identifying patients with a specific disease. We have a sample of 200 patients, and we want to determine the cost effectiveness of using the questionnaire.

Here are the steps:

1. **Determine the prevalence of the disease**: The prevalence of the disease in the population is 10%.
2. **Calculate the cost of administering the questionnaire**: The cost of administering the questionnaire to 200 patients is $1,000.
3. **Determine the sensitivity and specificity of the questionnaire**: The sensitivity of the questionnaire is 80%, and the specificity is 90%.
4. **Calculate the number of true positives, false positives, false negatives, and true negatives**: Using the sensitivity and specificity, we calculate the number of true positives (TP), false positives (FP), false negatives (FN), and true negatives (TN).

|  | Predicted Positive | Predicted Negative |
| --- | --- | --- |
| Actual Positive | 16 (80% of 20) | 4 (20% of 20) |
| Actual Negative | 2 (10% of 180) | 178 (90% of 180) |

TP = 16, FP = 2, FN = 4, TN = 178

5. **Calculate the cost effectiveness**: The cost effectiveness of the questionnaire can be calculated by comparing the cost of administering the questionnaire to the number of accurate diagnoses made. Let's assume that the cost of treating a patient with the disease is $5,000, and the cost of treating a patient without the disease is $0.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The cost effectiveness of questionnaires increases as the sample size increases.",
    "answer": "True",
    "explanation": "As the sample size increases, the estimates become more precise, and the cost per respondent decreases."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher wants to study the opinions of 10,000 students about a new curriculum. She has a budget of $5,000. What would be the most cost-effective way to collect data?",
    "answer": "Using a questionnaire",
    "explanation": "Given the large sample size and limited budget, using a questionnaire would be the most cost-effective way to collect data."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how non-response bias can affect the cost effectiveness of a questionnaire study. Provide an example.",
    "answer": "Non-response bias can affect the cost effectiveness of a questionnaire study by leading to a sample that is not representative of the population. For example, if a questionnaire is sent to 1,000 students, but only 600 respond, the results may not accurately reflect the opinions of all 1,000 students. This can lead to biased estimates and decreased cost effectiveness.",
    "explanation": "Non-response bias can lead to a sample that is not representative of the population, decreasing the cost effectiveness of the study."
  }
]
```