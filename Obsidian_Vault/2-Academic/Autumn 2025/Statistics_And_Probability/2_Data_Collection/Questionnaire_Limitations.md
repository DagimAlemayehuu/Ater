---

title: Questionnaire_Limitations
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: '[[2_Data_Collection_Hub]]'
source: '[[2.pdf]]'
source_pages:
- 92
mode: MATH-STAT
read: false
generated: true
prerequisites:
- '[[Collection_Of_Data]]'
- '[[Sample]]'
- '[[Census]]'
- '[[Advantages_And_Disadvantages_Of_Census_And_Sample_Survey]]'
- '[[Random_Sampling]]'

---


# 1. Mental Model

A questionnaire can be thought of as a tool for collecting data, similar to a fishing net used to catch a specific type of fish. Just as a fishing net has different mesh sizes and shapes to target specific fish populations, a questionnaire has different question types and structures to target specific information from respondents. The effectiveness of the questionnaire in collecting accurate and relevant data depends on its design, just like the effectiveness of the fishing net depends on its mesh size and the skill of the fisherman.

# 2. Statistical Modeling & Inference

When conducting a [[Collection_Of_Data]], researchers often rely on [[Sample]] surveys rather than a [[Census]] due to the [[Advantages_And_Disadvantages_Of_Census_And_Sample_Survey]]. A well-designed [[Sample]] is obtained through [[Random_Sampling]], such as [[Simple_Random_Sampling]], [[Systematic_Random_Sampling]], [[Stratified_Random_Sampling]], or [[Cluster_Random_Sampling]], to minimize [[Sampling_Error]]. However, the [[Response_Rate]] can be affected by the [[Questionnaire_Cost_Effectiveness]] and [[Questionnaire_Limitations]], which can lead to [[Low_Response_Rate]] and [[Impact_On_Statistical_Analysis]]. To mitigate these issues, researchers must carefully consider the [[Data_Collection_Methods]] and [[Scopes_Of_Statistical_Investigations]] to ensure accurate and reliable results. By understanding the trade-offs between [[Cost_Comparison]] and [[Response_Rate_Importance]], researchers can design effective studies that balance [[Geographic_Areas]] and [[Large_Sample_Sizes]].

# 3. Confounding Variables & Bias

| Limitation Type | Description | Impact on Study |
| --- | --- | --- |
| Low Response Rate | Failure of respondents to return or complete questionnaires | Biased sample, reduced generalizability |
| Poor Questionnaire Design | Ambiguous or leading questions, inadequate response options | Inaccurate or incomplete data, increased [[Sampling_Error]] |
| Non-Response Bias | Systematic differences between respondents and non-respondents | Biased estimates, incorrect conclusions |
| Social Desirability Bias | Respondents providing answers they think are socially acceptable | Inaccurate data, biased results |

When using questionnaires, researchers must be aware of potential limitations, such as low response rates, poor design, and non-response bias, which can lead to flawed conclusions. If not addressed, these issues can result in biased samples, reduced generalizability, and inaccurate data, ultimately affecting the validity of the study. A critical evaluation of questionnaire limitations is essential to ensure the accuracy and reliability of the results. What might happen if a researcher fails to pilot-test their questionnaire, and what are the potential consequences for the study's findings?

## 4. Probability Distribution

| Outcome | Probability |
| --- | --- |
| 0 | 0.2 |
| 1 | 0.5 |
| 2 | 0.3 |

$$
P(X = k) = \begin{cases} 
0.2 & \text{if } k = 0 \\
0.5 & \text{if } k = 1 \\
0.3 & \text{if } k = 2 
\end{cases}
$$

The markdown table represents the probability distribution of a discrete random variable $X$, where each row corresponds to a possible outcome and its associated probability. The LaTeX equation defines the probability function $P(X = k)$ for each outcome $k$.

## 5. Walkthrough

1. Define the problem: Consider a questionnaire with a question that has 3 possible outcomes: 0, 1, and 2. We want to model the probability distribution of the outcome $X$.
2. Identify the possible outcomes: The possible outcomes are $k = 0, 1, 2$.
3. Assign probabilities: Based on prior knowledge or data, we assign probabilities to each outcome: $P(X = 0) = 0.2$, $P(X = 1) = 0.5$, and $P(X = 2) = 0.3$.
4. Verify the probabilities: Check that the probabilities satisfy the condition $\sum_{k} P(X = k) = 1$: $0.2 + 0.5 + 0.3 = 1$.
5. Write the probability function: Define the probability function $P(X = k)$ as a piecewise function, as shown in the LaTeX equation.
6. Interpret the results: The probability distribution $P(X = k)$ represents the chance of observing each outcome $k$ when using the questionnaire.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A questionnaire is a tool for collecting data.",
    "answer": true,
    "explanation": "This statement is true as a questionnaire is indeed a tool used for collecting data from respondents."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Given that a questionnaire is designed to collect data on customer satisfaction, what happens if the questions are leading or biased?",
    "answer": "The collected data may be inaccurate or unreliable.",
    "explanation": "If the questions in a questionnaire are leading or biased, respondents may be influenced to provide answers that do not accurately reflect their true opinions or experiences, resulting in inaccurate or unreliable data."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how a poorly designed questionnaire can affect the validity and reliability of the collected data.",
    "answer": "A poorly designed questionnaire can significantly impact the validity and reliability of the collected data. If the questions are unclear, leading, or biased, respondents may provide inaccurate or incomplete answers, which can lead to incorrect conclusions being drawn from the data. Furthermore, a poorly designed questionnaire may also lead to respondent fatigue, causing respondents to lose interest or become frustrated, which can result in incomplete or inaccurate data. Therefore, it is crucial to carefully design a questionnaire to ensure that it is clear, concise, and free from bias to collect accurate and reliable data.",
    "explanation": "A well-designed questionnaire is essential to collect accurate and reliable data. A poorly designed questionnaire can lead to inaccurate or incomplete data, which can have serious consequences in research or decision-making."
  }
]

```