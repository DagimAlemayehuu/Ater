---
title: Random_Sampling
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 25
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Sample]]"
---

# 1. Mental Model
Imagine you're at a school with 1000 students, and you want to pick a group of 100 students to ask about their favorite food. In random sampling, it's like putting all 1000 students' names in a hat, then closing your eyes and picking out 100 names. Each student has an equal chance of being picked, so your group of 100 should represent the whole school fairly.

# 2. Statistical Modeling & Inference
Random sampling works by ensuring that every element in the population has an equal [[Probability]] of being selected for the sample. This is typically achieved through the use of [[Pseudorandom Number Generators]] (PRNGs) or [[Random_Number_Generators]] (RNGs), which generate a sequence of numbers that appear to be randomly and uniformly distributed. The process involves assigning a unique identifier to each element in the population, then using the PRNG or RNG to select a subset of these identifiers. The selected identifiers correspond to the elements that will be included in the sample. By using random sampling, researchers can reduce [[Sampling_Bias]] and increase the [[Generalizability]] of their findings.

# 3. Confounding Variables & Bias
However, random sampling is not foolproof and can be susceptible to [[Selection_Bias]] if the sampling frame is not accurately representative of the population. For instance, if the list of students is outdated and does not include new students or excludes students who have left the school, the sample may not be representative of the current student population. Additionally, even with random sampling, [[Nonresponse_Bias]] can occur if certain groups of students are more likely to refuse to participate or are harder to reach. Researchers must carefully consider these potential biases when designing their sampling strategy and take steps to mitigate them, such as using [[Stratified_Sampling]] or [[Weighting]] to adjust for nonresponse.
# 4. Probability Distribution
```markdown
| Outcome | Probability |
|---------|------------|
| Selected | 0.1        |
| Not Selected | 0.9      |
```
To read this table: The probability distribution shows that each student has a 0.1 (or 10%) chance of being selected for the sample and a 0.9 (or 90%) chance of not being selected. This distribution represents the probability of each outcome for a single student in the random sampling process.

## 5. Walkthrough
Suppose we want to randomly select 100 students out of 1000 to participate in a survey. Here's how we can do it:

1. **Assign unique identifiers**: Assign a unique number to each student from 1 to 1000.
2. **Generate random numbers**: Use a random number generator to generate 100 unique numbers between 1 and 1000.
3. **Select students**: Select the students whose numbers match the generated random numbers.
4. **Calculate probability**: The probability of each student being selected is 100/1000 = 0.1 (or 10%).
5. **Verify representation**: To verify that the sample is representative, we can calculate the mean and standard deviation of a specific characteristic (e.g., age) in the sample and compare it to the population.

For example, let's say the population mean age is 20 with a standard deviation of 2. After selecting the sample, we calculate the sample mean age to be 20.2 with a standard deviation of 1.9. This suggests that the sample is fairly representative of the population.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "In random sampling, every element in the population has an equal chance of being selected for the sample.",
    "answer": "True",
    "explanation": "This is the fundamental principle of random sampling."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher wants to sample 50 students from a class of 200. What is the probability that a student will be selected?",
    "answer": "0.25",
    "explanation": "The probability of selection is 50/200 = 0.25."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how you would implement random sampling to select 100 students from a population of 5000 students. Be sure to discuss potential biases and how to mitigate them.",
    "answer": "To implement random sampling, I would first assign a unique identifier to each student from 1 to 5000. Then, I would use a random number generator to generate 100 unique numbers between 1 and 5000. The students whose numbers match the generated random numbers would be selected. To mitigate potential biases, I would ensure that the sampling frame is accurate and representative of the population. I would also consider using stratified sampling or weighting to adjust for nonresponse.",
    "explanation": "This question requires the student to demonstrate their understanding of random sampling and its implementation, as well as their ability to think critically about potential biases and mitigation strategies."
  }
]
```