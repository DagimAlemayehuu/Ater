---
title: Disadvantage_of_Written_Questionnaires
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 92
mode: MATH-STAT
read: false
generated: true
---

# 1. Mental Model
Imagine you're at a school bake sale, but instead of asking people directly if they want to buy a cookie, you leave a note on a piece of paper saying "Do you want to buy a cookie? (Yes/No)". If people walk by without picking up the note, you might not get an accurate count of how many cookies to sell. Similarly, with written questionnaires, some people might not even see or engage with the questions.

# 2. Statistical Modeling & Inference
The disadvantage of written questionnaires can be understood through the lens of [[Nonresponse_Bias]], [[Survey_Research]], and [[Item_Nonresponse]]. When respondents don't answer written questionnaires, it can lead to biased estimates of population parameters. Mechanically, this occurs because the sample of respondents may not be representative of the target population, violating the assumption of [[Random_Sampling]]. As a result, [[Maximum_Likelihood_Estimates]] may not accurately reflect the true relationships between variables.

# 3. Confounding Variables & Bias
The low response rate issue with written questionnaires can be exacerbated by [[Social_Desirability_Bias]] and [[Self_Selection_Bias]]. For instance, respondents who do respond to a written questionnaire might be more motivated or have stronger opinions than those who don't, leading to an overrepresentation of extreme views. Furthermore, [[Nonresponse_Error]] can occur when certain subgroups, such as those with lower literacy levels or busier schedules, are less likely to respond. This can result in [[Biased_Estimates]] and reduced [[External_Validity]] of the findings.
# 4. Probability Distribution
```markdown
| Response | Probability |
| --- | --- |
| Respond | 0.6 |
| Don't Respond | 0.4 |
```
To read this table: The probability that a respondent will respond to a written questionnaire is 0.6, while the probability that they will not respond is 0.4. This table represents the probability distribution of response outcomes for a written questionnaire.

## 5. Walkthrough
Let's consider a scenario where we want to evaluate the effectiveness of a new marketing strategy using a written questionnaire. We plan to send the questionnaire to a random sample of 1000 customers.

1. **Define the problem**: We want to estimate the proportion of customers who will respond to the questionnaire and provide feedback on the new marketing strategy.
2. **Assume a probability distribution**: Based on past experience, we assume that the probability of a customer responding to the questionnaire is 0.6 (as shown in the table above).
3. **Calculate the expected number of responses**: We expect 60% of the 1000 customers to respond, which is 0.6 x 1000 = 600 responses.
4. **Calculate the standard error**: The standard error of the proportion is given by $\sqrt{\frac{p(1-p)}{n}}$, where $p$ is the probability of response (0.6) and $n$ is the sample size (1000). This gives us $\sqrt{\frac{0.6(1-0.6)}{1000}} = 0.0155$.
5. **Interpret the results**: With an expected 600 responses, we can estimate the proportion of customers who support the new marketing strategy. However, we need to account for the non-response bias and consider the potential impact on our estimates.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Written questionnaires are not susceptible to non-response bias.",
    "answer": "False",
    "explanation": "Written questionnaires can suffer from non-response bias, as some respondents may not answer or engage with the questions."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher sends a written questionnaire to a sample of 500 customers to evaluate customer satisfaction. However, only 200 customers respond. What potential issue may arise in this scenario?",
    "answer": "Non-response bias may occur, as the sample of respondents may not be representative of the target population.",
    "explanation": "The low response rate may lead to biased estimates of customer satisfaction, as the respondents may not be representative of the entire customer base."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how social desirability bias can affect the results of a written questionnaire. Provide an example of how this bias can occur.",
    "answer": "Social desirability bias occurs when respondents provide answers that they think are socially acceptable, rather than their true opinions. For example, in a questionnaire about environmental behavior, respondents may overreport their recycling habits to appear more environmentally friendly.",
    "explanation": "This bias can lead to inaccurate estimates of population parameters, as respondents may not provide truthful answers."
  }
]
```