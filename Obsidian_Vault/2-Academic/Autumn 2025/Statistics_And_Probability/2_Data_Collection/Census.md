---
title: Census
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 10
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Population]]"
---

# 1. Mental Model
Imagine you're trying to count the number of students in your school. Instead of picking a few classrooms to count, you decide to go to every single classroom and count each student. This way, you get an exact number of students in the entire school. A census works similarly, where you collect data from every single member of a population, like every person living in a country.

# 2. Statistical Modeling & Inference
A census involves collecting data from the entire population, which means you're working with a [[Complete_Data_Set]]. This allows for precise calculations of population parameters, such as the mean, median, and standard deviation, without the need for [[Sampling_Frame]] or [[Statistical_Inference]]. Mechanically, a census works by enumerating every unit in the population, which can be done through [[Survey_Methodology]] like mail-in questionnaires, online responses, or in-person interviews. The resulting data can be analyzed using [[Descriptive_Statistics]] to summarize and describe the population.

# 3. Confounding Variables & Bias
While a census aims to collect data from every member of a population, it's not immune to issues like [[Non_Response_Bias]] or [[Measurement_Error]]. For instance, some individuals may choose not to respond to the census survey, which can lead to biased estimates if non-response is correlated with certain characteristics. Additionally, [[Coverage_Error]] can occur if certain subgroups of the population are under- or over-counted. Census data can also be affected by [[Social_Desirability_Bias]], where respondents provide inaccurate answers to appear more favorable. These issues highlight the importance of careful survey design and data quality control in census data collection.
# 4. Probability Distribution
```markdown
| Census Outcome | Probability |
| --- | --- |
| Complete Enumeration | 1.0 |
| Incomplete Enumeration | 0.0 |
```
In an ideal census, every member of the population is counted exactly once. The probability table above reflects this, where the probability of a complete enumeration is 1.0 (or 100%) and the probability of an incomplete enumeration is 0.0.

## 5. Walkthrough
Let's say we're conducting a census of students in a school with 5 classrooms. Our goal is to count every student in the school.

1. **Classroom 1**: We count 25 students.
2. **Classroom 2**: We count 30 students.
3. **Classroom 3**: We count 20 students.
4. **Classroom 4**: We count 28 students.
5. **Classroom 5**: We count 22 students.

To calculate the total number of students in the school, we simply add up the counts from each classroom:

25 + 30 + 20 + 28 + 22 = 125

So, the total number of students in the school is 125.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A census involves collecting data from a sample of the population.",
    "answer": "False",
    "explanation": "A census involves collecting data from every member of the population, not a sample."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose you're conducting a census of employees in a company with 10 departments. If 5 departments respond to the census survey but 5 departments do not, what type of error is this?",
    "answer": "Non-response bias",
    "explanation": "This is an example of non-response bias, where some subgroups of the population (in this case, 5 departments) do not respond to the census survey."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how a census can be affected by social desirability bias. Provide an example.",
    "answer": "Social desirability bias occurs when respondents provide inaccurate answers to appear more favorable. For example, in a census survey, respondents may underreport their income or overreport their education level to appear more socioeconomically advantaged.",
    "explanation": "This question requires the student to think critically about potential biases in census data collection and provide a concrete example."
  }
]
```