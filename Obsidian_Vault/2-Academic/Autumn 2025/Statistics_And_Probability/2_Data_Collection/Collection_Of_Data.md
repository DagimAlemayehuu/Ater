---
title: Collection_Of_Data
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 2
- 3
mode: MATH-STAT
read: false
generated: true
---

# 1. Mental Model
Imagine you're a librarian trying to create a comprehensive catalog of all the books in your library. You need to gather information about each book, such as its title, author, publication date, and genre. This process of gathering information about each book is similar to collecting data, where you're gathering facts and figures from different sources to create a comprehensive understanding.

# 2. Statistical Modeling & Inference
The collection of data involves gathering information from various sources, which can be thought of as [[Data_Points]] that are used to create a [[Data_Set]]. This data set can then be used to make inferences about a [[Population]] through the use of statistical methods, such as [[Sampling_Frame]] and [[Estimator]] functions. Mechanically, data collection involves identifying relevant data sources, designing a data collection instrument, and implementing a [[Data_Pipeline]] to gather and store the data. The quality of the collected data is crucial, as it directly affects the accuracy of any subsequent [[Statistical_Inference]] or [[Machine_Learning]] models.

# 3. Confounding Variables & Bias
When collecting data, it's essential to consider potential [[Confounding_Variables]] that could affect the accuracy of the data. For instance, if you're collecting data about people's reading habits, you may need to account for factors like age, education level, or socioeconomic status. Failure to do so can result in [[Selection_Bias]] or [[Measurement_Bias]], which can lead to [[Biased_Estimates]] and flawed conclusions. Additionally, data collection methods can also introduce [[Sampling_Bias]], such as when using a [[Non_Probability_Sample]], which can limit the generalizability of the findings. Therefore, it's crucial to carefully design the data collection process to minimize these biases and ensure the data is representative of the population of interest.
# 4. Probability Distribution
```markdown
| Outcome | Probability |
| --- | --- |
| 0    | 0.1       |
| 1    | 0.3       |
| 2    | 0.4       |
| 3    | 0.2       |
```
This probability table represents a discrete probability distribution, where each outcome has a specific probability of occurring. To read it, simply look at each outcome and its corresponding probability, which represents the chance of that outcome happening.

## 5. Walkthrough
Let's say we're collecting data on the number of books borrowed per day from a library, and we want to model this using a probability distribution. Here's a step-by-step walkthrough:

1. **Define the problem**: We want to model the number of books borrowed per day using a probability distribution.
2. **Collect data**: We collect data on the number of books borrowed per day for 10 days: 0, 1, 2, 2, 3, 1, 2, 0, 1, 2.
3. **Calculate frequencies**: We calculate the frequency of each outcome: 0 (2 times), 1 (3 times), 2 (4 times), 3 (1 time).
4. **Calculate probabilities**: We calculate the probability of each outcome by dividing the frequency by the total number of observations (10): 0 (2/10 = 0.2), 1 (3/10 = 0.3), 2 (4/10 = 0.4), 3 (1/10 = 0.1).
5. **Create a probability distribution**: We create a probability distribution table using the calculated probabilities.

| Outcome | Probability |
| --- | --- |
| 0    | 0.2       |
| 1    | 0.3       |
| 2    | 0.4       |
| 3    | 0.1       |

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A probability distribution is a table that shows the probability of each possible outcome.",
    "answer": "True",
    "explanation": "A probability distribution is indeed a table that shows the probability of each possible outcome."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher collects data on the height of 100 students. The data shows a mean height of 175 cm and a standard deviation of 5 cm. What type of probability distribution is this?",
    "answer": "Normal distribution",
    "explanation": "The data shows a mean and standard deviation, which are characteristics of a normal distribution."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how to create a probability distribution table for a discrete random variable.",
    "answer": "To create a probability distribution table, first collect data on the random variable. Then, calculate the frequency of each outcome and divide by the total number of observations to get the probability. Finally, create a table with the outcomes and their corresponding probabilities.",
    "explanation": "This question tests the student's ability to apply their knowledge of probability distributions to a real-world scenario."
  }
]
```