---

title: Questionnaire_Cost_Effectiveness
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: '[[2_Data_Collection_Hub]]'
source: '[[2.pdf]]'
source_pages:
- 91
mode: MATH-STAT
read: false
generated: true
prerequisites:
- '[[Data_Collection_Methods]]'
- '[[Collection_Of_Data]]'
- '[[Large_Sample_Sizes]]'
- '[[Low_Response_Rate]]'
- '[[Impact_On_Statistical_Analysis]]'

---


# 1. Mental Model

The concept of Questionnaire Cost Effectiveness can be likened to a well-optimized assembly line in a manufacturing process. Just as an assembly line streamlines production by minimizing labor and material costs, a cost-effective questionnaire streamlines data collection by minimizing the costs associated with [[Data_Collection_Methods]] while maximizing the quality and quantity of the [[Collection_Of_Data]]. In both cases, efficiency is achieved by identifying and eliminating unnecessary steps, thereby reducing overall expenditure.

# 2. Statistical Modeling & Inference

When evaluating the cost effectiveness of questionnaires, researchers must consider the trade-offs between [[Large_Sample_Sizes]] and [[Low_Response_Rate]], as these factors can significantly impact [[Impact_On_Statistical_Analysis]]. A well-designed questionnaire can increase the [[Response_Rate]], thereby reducing [[Sampling_Error]] and improving the representativeness of the [[Sample]] drawn from the [[Population]]. In contrast, a poorly designed questionnaire may lead to [[Convenience_Sampling]] or [[Quota_Sampling]], which can introduce [[Bias]] and compromise the validity of the [[Collection_Of_Data]]. The cost effectiveness of a questionnaire is also influenced by [[Questionnaire_Cost_Effectiveness]] and [[Cost_Comparison]] with other [[Data_Collection_Methods]], such as face-to-face interviews. By using [[Simple_Random_Sampling]] or [[Stratified_Random_Sampling]], researchers can ensure that their [[Sample]] is representative of the [[Population]].

# 3. Confounding Variables & Bias

| Condition | Description | Impact on Questionnaire Cost Effectiveness |
| --- | --- | --- |
| Low Response Rate | High [[Low_Response_Rate]] can lead to biased [[Sample]] | Decreases cost effectiveness |
| Poor Questionnaire Design | Ambiguous or leading questions | Introduces [[Bias]], decreases cost effectiveness |
| Inadequate Sampling Frame | [[Sampling_Error]] due to incomplete [[Population]] coverage | Decreases cost effectiveness |
| High Non-Response Rate | Failing to collect data from a significant portion of the [[Sample]] | Decreases cost effectiveness, introduces [[Bias]] |

A flawed step in evaluating questionnaire cost effectiveness might involve ignoring the impact of [[Low_Response_Rate]] on [[Sampling_Error]], leading to biased inferences about the [[Population]]. A quiz question to test validity might ask: "What is a potential consequence of a low response rate on the cost effectiveness of a questionnaire?" The correct answer would highlight the introduction of bias and decreased cost effectiveness.

## 4. Probability Distribution

| $X$ | $P(X = x)$ |
| --- | --- |
| 0    | 0.2         |
| 1    | 0.3         |
| 2    | 0.5         |

$$
E[X] = \sum_{x} x \cdot P(X = x) = 0 \cdot 0.2 + 1 \cdot 0.3 + 2 \cdot 0.5 = 1.3
$$

The probability table represents the probability distribution of a discrete random variable $X$, where $X$ can take on values 0, 1, or 2, and $P(X = x)$ represents the probability of $X$ taking on the value $x$. The block LaTeX equation calculates the expected value of $X$, denoted as $E[X]$, which represents the long-term average value of $X$.

## 5. Walkthrough

1. Define the probability distribution of the random variable $X$: 
Let $X$ be a discrete random variable with possible values 0, 1, and 2.

2. Assign probabilities to each possible value of $X$: 
$P(X = 0) = 0.2$, $P(X = 1) = 0.3$, and $P(X = 2) = 0.5$.

3. Verify that the probabilities form a valid probability distribution: 
$\sum_{x} P(X = x) = 0.2 + 0.3 + 0.5 = 1$.

4. Calculate the expected value of $X$: 
$E[X] = \sum_{x} x \cdot P(X = x)$.

5. Perform the calculation of $E[X]$: 
$E[X] = 0 \cdot 0.2 + 1 \cdot 0.3 + 2 \cdot 0.5$.

6. Simplify the expression for $E[X]$: 
$E[X] = 0 + 0.3 + 1 = 1.3$.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The concept of Questionnaire Cost Effectiveness is primarily about reducing the costs of data collection.",
    "answer": false,
    "explanation": "The concept of Questionnaire Cost Effectiveness is about minimizing the costs associated with data collection while maximizing the quality and quantity of the data collected."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Given a questionnaire that is sent to a large sample of respondents, but many respondents do not answer the questions that are most relevant to the research question, what happens to the cost effectiveness of the questionnaire?",
    "answer": "The cost effectiveness of the questionnaire decreases because the data collected may not be useful or relevant, leading to a waste of resources.",
    "explanation": "If many respondents do not answer the most relevant questions, the data collected may not accurately represent the population or address the research question, making the questionnaire less cost effective."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how the mental model analogy of a well-optimized assembly line can be applied to improve the cost effectiveness of a questionnaire.",
    "answer": "The mental model analogy of a well-optimized assembly line can be applied to improve the cost effectiveness of a questionnaire by streamlining the data collection process, eliminating unnecessary questions, and minimizing labor and material costs. This can be achieved by identifying and eliminating redundant or irrelevant questions, using efficient data collection methods, and optimizing the questionnaire design to maximize response rates and data quality.",
    "explanation": "By applying the mental model analogy of a well-optimized assembly line, questionnaire designers can identify areas for improvement and optimize the data collection process to achieve greater efficiency and effectiveness."
  }
]

```