---
title: Simple_Random_Sampling
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 29
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Random_Sampling]]"
---

# 1. Mental Model
Imagine you have a large box of colored marbles, and you want to know the average number of red marbles. Simple Random Sampling is like reaching into the box with your eyes closed, pulling out a handful of marbles, and then checking their colors. This process helps ensure that every marble in the box has an equal chance of being selected.

# 2. Statistical Modeling & Inference
Simple Random Sampling works by assigning a unique identifier to each member of the population, then using a [[Random_Number_Generator]] to select a subset of these identifiers. The selected identifiers correspond to the sample. Mechanically, this involves generating a [[Probability_Distribution]] that gives each member an equal chance of being selected, which is typically achieved through a [[Uniform_Distribution]]. The sample is then used to make inferences about the population, such as estimating the population mean or proportion. The accuracy of these inferences depends on the sample size and the [[Sampling_Frame]].

# 3. Confounding Variables & Bias
Simple Random Sampling can be susceptible to bias if the sampling frame is not accurate or if there are [[Non_Response_Bias]] issues. For example, if the list of identifiers is outdated or incomplete, the sample may not be representative of the population. Additionally, if certain subgroups are underrepresented in the sample due to [[Selection_Bias]], the results may be skewed. To mitigate these issues, it's essential to ensure that the sampling frame is up-to-date and that the random number generator is truly `random` and not `biased`. Furthermore, techniques like [[Stratified_Sampling]] can be used to ensure that subgroups are adequately represented in the sample.
# 4. Probability Distribution
```markdown
| Outcome | Probability |
|---------|-------------|
| Red     | 0.4         |
| Blue    | 0.3         |
| Green   | 0.3         |
```
To read this table, assume that we have a box of marbles with different colors. The table represents the probability distribution of drawing a marble of a specific color. For example, the probability of drawing a red marble is 0.4 or 40%, while the probability of drawing a blue or green marble is 0.3 or 30% each.

## 5. Walkthrough
Let's say we have a population of 1000 students, and we want to estimate the average height of the students using Simple Random Sampling. Here are the steps:

1. **Assign unique identifiers**: Assign a unique identifier to each student in the population, ranging from 1 to 1000.
2. **Generate random numbers**: Use a random number generator to select a sample of 100 students. For example, the selected identifiers are: 12, 34, 56, ..., 987.
3. **Collect data**: Measure the height of each selected student. For example:
	* Student 12: 165 cm
	* Student 34: 170 cm
	* Student 56: 160 cm
	* ...
	* Student 987: 168 cm
4. **Calculate sample mean**: Calculate the average height of the sample: (165 + 170 + 160 + ... + 168) / 100 = 166.5 cm
5. **Make inference**: Use the sample mean to make an inference about the population mean. For example, we can estimate that the average height of all 1000 students is approximately 166.5 cm.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "In Simple Random Sampling, every member of the population has an equal chance of being selected.",
    "answer": "True",
    "explanation": "This is a fundamental property of Simple Random Sampling."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher wants to estimate the average salary of employees in a company. The company has 500 employees, and the researcher selects a sample of 50 employees using Simple Random Sampling. If the sample mean salary is $50,000, what can be inferred about the population mean salary?",
    "answer": "The population mean salary is approximately $50,000.",
    "explanation": "This is an application of Simple Random Sampling to make an inference about the population mean."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how Simple Random Sampling can be used to estimate the proportion of students who prefer a certain brand of smartphone. Describe the steps involved and any potential sources of bias.",
    "answer": "Simple Random Sampling can be used to estimate the proportion of students who prefer a certain brand of smartphone by assigning unique identifiers to each student, generating random numbers to select a sample, and then surveying the selected students about their preferences. Potential sources of bias include non-response bias and selection bias if the sampling frame is not accurate.",
    "explanation": "This requires the student to think critically about the application of Simple Random Sampling in a real-world scenario."
  }
]
```