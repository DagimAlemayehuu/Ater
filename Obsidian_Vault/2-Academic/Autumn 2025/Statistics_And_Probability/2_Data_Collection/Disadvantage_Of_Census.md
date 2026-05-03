---
title: Disadvantage_Of_Census
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 19
- 20
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Census]]"
---

# 1. Mental Model
Imagine you're trying to count every single student in an enormous school with thousands of kids. A census would be like counting each student one by one, which can be extremely time-consuming and prone to errors. It's like trying to solve a massive puzzle with millions of pieces.

# 2. Statistical Modeling & Inference
The disadvantage of a census arises from its [[Exhaustive_Enumeration]] approach, where every single unit in the population is observed. This leads to an enormous [[Data_Volume]] and [[Computational_Complexity]], making it a time-consuming and expensive process. Mechanically, a census involves collecting data from every individual or unit, which can be a daunting task, especially when dealing with large or dispersed populations. The process often requires a significant amount of resources, including [[Human_Resources]] and [[Financial_Resources]], to collect, process, and analyze the data.

# 3. Confounding Variables & Bias
The disadvantage of a census is also influenced by boundary conditions, such as the [[Sampling_Frame]] and [[Non_Response]] rates. In some cases, a census may be impossible to conduct, such as when dealing with a highly mobile or hard-to-reach population. Failure states, like [[Data_Quality_Issues]] and [[Coverage_Error]], can also arise, leading to biased estimates and incorrect conclusions. Furthermore, the [[Survey_Methodology]] used in a census can introduce [[Measurement_Error]], which can affect the accuracy of the results. When these issues are not properly addressed, they can lead to [[Selection_Bias]] and [[Information_Bias]], ultimately compromising the validity of the census.
# 4. Probability Distribution
```markdown
| Census Outcome | Probability |
| --- | --- |
| Complete and Accurate Data | 0.2 |
| Incomplete Data | 0.3 |
| Inaccurate Data | 0.5 |
```
To read this table, we consider the probability distribution of census outcomes. The table shows that there is a 20% chance of obtaining complete and accurate data, a 30% chance of incomplete data, and a 50% chance of inaccurate data. This distribution highlights the potential risks and challenges associated with conducting a census.

## 5. Walkthrough
Let's consider a scenario where a government agency wants to conduct a census of all residents in a large city. Here are the steps to apply the concept:

1. **Define the population**: The population of interest is all residents in the city, which is approximately 1 million people.
2. **Determine the resources required**: The agency estimates that it will need 10,000 staff members and $100 million to collect data from every resident.
3. **Assess the data quality**: The agency expects that 20% of the data collected will be incomplete or inaccurate due to various reasons such as non-response or incorrect reporting.
4. **Evaluate the costs and benefits**: The agency estimates that the total cost of conducting the census will be $150 million, which is a significant expense for the city.
5. **Consider alternative approaches**: Given the high costs and potential data quality issues, the agency decides to consider alternative approaches, such as sampling a subset of the population to achieve more accurate and efficient results.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A census is a method of collecting data from a sample of the population.",
    "answer": "False",
    "explanation": "A census involves collecting data from every individual or unit in the population, not a sample."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher wants to study the average income of all employees in a large company. The company has 10,000 employees. What are the advantages and disadvantages of conducting a census versus sampling a subset of employees?",
    "answer": "Conducting a census would provide complete data but would be time-consuming and expensive. Sampling a subset of employees would be more efficient but may not accurately represent the entire population.",
    "explanation": "The researcher needs to weigh the pros and cons of each approach, considering factors such as data quality, resources required, and potential biases."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how a census can be affected by boundary conditions such as the sampling frame and non-response rates. Provide an example of how these issues can impact the results of a census.",
    "answer": "A census can be affected by boundary conditions such as the sampling frame and non-response rates. For example, if the sampling frame is incomplete or biased, the census may miss certain subgroups of the population. Similarly, if there are high non-response rates, the results may not accurately represent the population. For instance, in a census of a city's residents, if the sampling frame does not account for homeless individuals, they may be underrepresented in the results.",
    "explanation": "The student should discuss how boundary conditions can affect the validity of a census and provide a concrete example of the potential consequences."
  }
]
```