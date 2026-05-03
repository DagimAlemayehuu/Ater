---
title: Systematic_Random_Sampling
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 30
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Random_Sampling]]"
---

# 1. Mental Model
Imagine you're picking ice cream flavors from a huge box that has 100 flavors. In systematic random sampling, if you want to pick 10 flavors, you wouldn't just pick any 10, but you might pick every 10th flavor, starting from a random pick. This way, you ensure that your selection is spread out and represents the variety in the box.

# 2. Statistical Modeling & Inference
Systematic random sampling works by first determining a [[Sampling_Frame]] from which to select the sample. The process begins with a random start, and then every kth element from the [[Sampling_Frame]] is selected, where k is determined by dividing the population size by the desired sample size. For instance, if you want to sample 1,000 elements from a population of 10,000, k would be 10,000 / 1,000 = 10. This means every 10th element is selected. This method ensures that the sample is distributed across the entire [[Population_Parameter]], reducing bias. The mechanical process involves generating a random start point, then applying the interval (k) to select subsequent elements. This technique leverages [[Probability_Theory]] to ensure that every element has an equal chance of being selected.

# 3. Confounding Variables & Bias
However, systematic random sampling can introduce [[Selection_Bias]] if there's an underlying pattern in the population that coincides with the sampling interval. For example, if you're sampling students from a list that is ordered by class year and you select every 5th student, you might inadvertently sample only students from certain years. To mitigate this, it's crucial to ensure that the list from which you're sampling does not have a pattern that could skew the results. Additionally, if the population list has a [[Periodic_Function]] or cyclical pattern that matches the sampling interval, it could lead to [[Non_Probability_Sampling]] issues, where certain segments of the population are over or underrepresented. Understanding the structure of the population and ensuring a random start are key to minimizing these risks.
# 4. Probability Distribution
```markdown
| Outcome | Probability |
|---------|-------------|
| 0       | 0.1         |
| 1       | 0.3         |
| 2       | 0.4         |
| 3       | 0.2         |
```
To read this table, assume it's a probability distribution for the number of successes in a systematic random sample of size 10 from a population where the probability of success is 0.2. The table shows the probability of getting 0, 1, 2, or 3 successes.

## 5. Walkthrough
Here's a step-by-step walkthrough of systematic random sampling:

1. **Define the population and sample size**: Let's say we have a population of 1,000 students and we want to sample 100 students.
2. **Determine the sampling interval (k)**: Divide the population size by the sample size: k = 1,000 / 100 = 10.
3. **Randomly select a start point**: Let's say we randomly select a start point of 7.
4. **Select every kth element**: Starting from 7, select every 10th element: 7, 17, 27, ..., 997.
5. **List the sample**: The sample consists of students 7, 17, 27, ..., 997.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "In systematic random sampling, every element in the population has an equal chance of being selected.",
    "answer": "True",
    "explanation": "Systematic random sampling ensures that every element has an equal chance of being selected by using a random start point and a fixed interval."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher wants to sample 50 students from a population of 500. What is the sampling interval (k)?",
    "answer": "10",
    "explanation": "The sampling interval (k) is calculated by dividing the population size by the sample size: k = 500 / 50 = 10."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how systematic random sampling can introduce selection bias and provide an example.",
    "answer": "Systematic random sampling can introduce selection bias if there's an underlying pattern in the population that coincides with the sampling interval. For example, if you're sampling students from a list that is ordered by class year and you select every 5th student, you might inadvertently sample only students from certain years.",
    "explanation": "This question requires the student to think critically about the potential pitfalls of systematic random sampling and provide a concrete example."
  }
]
```