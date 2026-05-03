---

title: Cost_Comparison
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
- '[[Collection_Of_Data]]'
- '[[Sample]]'
- '[[Census]]'
- '[[Sampling_Error]]'
- '[[Random_Sampling]]'

---


# 1. Mental Model

A cost comparison between data collection methods can be thought of as navigating a trade-off landscape, where the axes represent the costs and effectiveness of different methods, such as questionnaires and face-to-face interviews. Just as a navigator must balance the trade-offs between distance, time, and resources when charting a course, a researcher must weigh the costs of data collection against the desired level of response rate and data quality. The mechanism matches in that both involve optimizing a set of variables to achieve a desired outcome, whether it's reaching a destination or collecting reliable data.

# 2. Statistical Modeling & Inference

When conducting a [[Collection_Of_Data]], researchers often rely on [[Sample]] surveys rather than a [[Census]] due to the associated [[Sampling_Error]] and costs. [[Random_Sampling]] methods, including [[Simple_Random_Sampling]], [[Systematic_Random_Sampling]], [[Stratified_Random_Sampling]], and [[Cluster_Random_Sampling]], can help mitigate [[Sampling_Error]] and ensure representativeness of the [[Population]]. However, the choice of sampling method depends on the [[Scopes_Of_Statistical_Investigations]], [[Data_Collection_Methods]], and available resources. A well-designed survey with a high [[Response_Rate]] and low [[Questionnaire_Cost_Effectiveness]] can provide reliable estimates, but may be impacted by [[Low_Response_Rate]] and [[Impact_On_Statistical_Analysis]]. By comparing costs and evaluating [[Cost_Comparison]], researchers can make informed decisions about data collection approaches.

# 3. Confounding Variables & Bias

| Variable | Description | Potential Bias |
| --- | --- | --- |
| Response Rate | Percentage of participants responding to the survey | Non-response bias |
| Questionnaire Cost | Cost of designing and administering the questionnaire | Measurement bias |
| Data Quality | Accuracy and reliability of collected data | Measurement error |
| Sampling Method | Method used to select participants | Selection bias |

When evaluating the cost comparison of different data collection methods, researchers must consider potential confounding variables and biases, such as non-response bias, measurement bias, and selection bias. If not properly addressed, these biases can lead to flawed conclusions and incorrect estimates, particularly if there are issues with [[Response_Rate_Importance]] or [[Questionnaire_Limitations]]. By acknowledging these limitations and taking steps to mitigate them, researchers can increase the validity and reliability of their findings. A flawed step in the process might involve ignoring the impact of [[Low_Response_Rate]] on the results or failing to account for [[Cost_Comparison]] when evaluating the effectiveness of different data collection methods.

## 4. Probability Distribution

### Markdown Probability Table and LaTeX Equation

| Method | Cost | Effectiveness |
| --- | --- | --- |
| Questionnaire | $X$ | $p$ |
| Face-to-Face Interview | $Y$ | $q$ |

$$
\begin{aligned}
P(\text{Questionnaire}) &= p \\
P(\text{Face-to-Face Interview}) &= q \\
\end{aligned}
$$

The markdown table represents the costs and effectiveness of different data collection methods, where $X$ and $Y$ are random variables denoting the costs, and $p$ and $q$ are the probabilities of effectiveness. The LaTeX equation represents the probability distribution of each method, where $P(\text{Method})$ denotes the probability of choosing a particular method.

## 5. Walkthrough

1. **Define the Random Variables**: Let $X$ and $Y$ be random variables representing the costs of using a questionnaire and face-to-face interview, respectively. Let $p$ and $q$ be the probabilities of effectiveness for each method.

2. **Specify the Probability Distribution**: Assume $X$ and $Y$ follow a normal distribution with means $\mu_X$ and $\mu_Y$, and variances $\sigma_X^2$ and $\sigma_Y^2$, respectively.

3. **Calculate the Expected Cost**: The expected cost of using a questionnaire is $E[X] = \mu_X$, and the expected cost of using a face-to-face interview is $E[Y] = \mu_Y$.

4. **Calculate the Expected Effectiveness**: The expected effectiveness of using a questionnaire is $E[p] = p$, and the expected effectiveness of using a face-to-face interview is $E[q] = q$.

5. **Compare the Methods**: To compare the methods, we can calculate the ratio of the expected cost to the expected effectiveness for each method: $\frac{E[X]}{E[p]} = \frac{\mu_X}{p}$ and $\frac{E[Y]}{E[q]} = \frac{\mu_Y}{q}$.

6. **Make a Decision**: Choose the method with the lower ratio, which represents the most cost-effective option: $\min \left\{ \frac{\mu_X}{p}, \frac{\mu_Y}{q} \right\}$.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "In a cost comparison between data collection methods, a higher response rate always increases the overall cost.",
    "answer": false,
    "explanation": "While a higher response rate can increase the overall cost, it is not a universal rule as costs can be managed through efficient methods."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Given that a researcher has a limited budget and needs to collect data from a geographically dispersed population, what happens to the cost-effectiveness of using face-to-face interviews compared to questionnaires?",
    "answer": "Face-to-face interviews become less cost-effective compared to questionnaires due to travel costs and time, while questionnaires can be more easily distributed and collected remotely.",
    "explanation": "The cost of traveling to dispersed locations for face-to-face interviews increases costs significantly, making questionnaires more cost-effective for such scenarios."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how the trade-off landscape model aids in decision-making for choosing between different data collection methods.",
    "answer": "The trade-off landscape model helps in visualizing and understanding the balance between costs and effectiveness of different data collection methods. By plotting costs against effectiveness, researchers can easily compare and contrast different methods, such as questionnaires and face-to-face interviews, to determine which method best fits their budget and data quality requirements. This model aids in decision-making by providing a clear and systematic approach to evaluating the trade-offs involved.",
    "explanation": "The trade-off landscape model provides a systematic approach to evaluating data collection methods, allowing researchers to make informed decisions based on their specific needs and constraints."
  }
]

```