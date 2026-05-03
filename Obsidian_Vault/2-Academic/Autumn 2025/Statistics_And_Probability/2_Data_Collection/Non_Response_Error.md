---
title: Non_Response_Error
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 17
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Sampling_Error]]"
---

# 1. Mental Model
Imagine you're trying to gather feedback from your classmates on a new school lunch menu. If some of your classmates don't return their feedback forms, you won't know their opinions, which can lead to an incomplete picture of how well the menu is liked or disliked. This is similar to a Non Response Error, where some participants in a survey don't respond, potentially skewing the results.

# 2. Statistical Modeling & Inference
Non Response Error occurs when a subset of the sample frame fails to respond to a survey, leading to a [[Biased_Sample]] that may not accurately represent the population of interest. Mechanically, this error arises when the [[Response_Propensity]] of certain subgroups within the population differs significantly from others, resulting in a [[Non-Response_Bias]] that can affect the [[Estimator]]'s accuracy. In statistical modeling, researchers often attempt to mitigate Non Response Error by using techniques such as [[Imputation]] or [[Weighting]] to adjust for the missing responses.

# 3. Confounding Variables & Bias
Non Response Error can be particularly problematic when the non-response rate varies across subgroups, leading to a [[Selection_Bias]] that can confound the relationships between variables. For instance, if younger respondents are more likely to non-respond, the resulting sample may overrepresent older individuals, potentially masking age-related differences in the outcome of interest. Furthermore, [[Non-Response_Error]] can also interact with other sources of error, such as [[Measurement_Error]], to produce [[Total_Error]] that is difficult to quantify or correct. To address these issues, researchers must carefully consider the potential for Non Response Error and develop strategies to minimize its impact on the survey results.
# 4. Probability Distribution
```markdown
| Response Status | Probability |
| --- | --- |
| Respond | 0.8 |
| Non-Respond | 0.2 |
```
To read this table: The probability of a participant responding to a survey is 0.8 (or 80%), while the probability of non-response is 0.2 (or 20%). This table represents the probability distribution of response status in a survey.

## 5. Walkthrough
Suppose we are conducting a survey to estimate the average satisfaction rating of a new product, with a sample size of 1000 participants. However, due to non-response error, 200 participants do not respond.

1. **Initial Sample**: We start with a sample of 1000 participants, and we assume that the response propensity is 0.8 (or 80%).
2. **Non-Response**: 200 participants do not respond, leaving us with 800 respondents.
3. **Response Rate**: The response rate is 800/1000 = 0.8, or 80%.
4. **Weighted Estimation**: To adjust for non-response, we can use weighting techniques. Let's assume that the non-respondents have a different satisfaction rating distribution than the respondents. We can assign a weight to the respondents based on their response propensity.
5. **Post-Stratification Weighting**: We can use post-stratification weighting to adjust for non-response. Let's assume that the population distribution is 50% young, 30% middle-aged, and 20% old. We can calculate the weighted satisfaction rating using the following formula: 

Weighted Satisfaction Rating = ( Satisfaction Rating of Young \* 0.5 \* Weight) + (Satisfaction Rating of Middle-Aged \* 0.3 \* Weight) + (Satisfaction Rating of Old \* 0.2 \* Weight)

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Non-response error occurs when a subset of the sample frame fails to respond to a survey.",
    "answer": "True",
    "explanation": "This statement is true. Non-response error occurs when a subset of the sample frame fails to respond to a survey, potentially leading to biased results."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher is conducting a survey to estimate the average income of a city. However, 30% of the participants do not respond. How can the researcher adjust for non-response error?",
    "answer": "The researcher can use weighting techniques, such as post-stratification weighting, to adjust for non-response error.",
    "explanation": "The researcher can use weighting techniques to adjust for non-response error. This involves assigning weights to the respondents based on their response propensity, which can help to mitigate the bias caused by non-response."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how non-response error can interact with other sources of error, such as measurement error, to produce total error that is difficult to quantify or correct.",
    "answer": "Non-response error can interact with other sources of error, such as measurement error, to produce total error that is difficult to quantify or correct. For instance, if non-response is related to the outcome of interest, and measurement error is present, the resulting estimates may be biased and inconsistent. This can lead to incorrect conclusions and decisions.",
    "explanation": "Non-response error can interact with other sources of error, such as measurement error, to produce total error that is difficult to quantify or correct. This requires careful consideration of the potential sources of error and the development of strategies to minimize their impact on the survey results."
  }
]
```