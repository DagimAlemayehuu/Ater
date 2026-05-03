---
title: Categories_Of_Sampling_Errors
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 15
- 16
- 17
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Sampling_Error]]"
---

# 1. Mental Model
Imagine you're trying to understand the favorite ice cream flavors of all the kids in a big school. You ask a few kids in one classroom and assume that's representative of the whole school. But, if you only asked kids in a classroom of students who love a specific teacher, or only those who are in a school club, your results might not accurately reflect the whole school's preferences. This is similar to how sampling errors occur when the group you choose to study isn't perfectly representative of the whole group you're interested in.

# 2. Statistical Modeling & Inference
Categories of sampling errors mechanically affect the validity of [[Statistical_Inference]] by introducing biases during the [[Sampling_Frame]] creation and data collection process. The process begins with defining the [[Target_Population]], which is the entire group of interest. However, errors can arise when there's a mismatch between the target population and the [[Sample_Frame]], which is the actual list from which the sample is drawn. This discrepancy can lead to incorrect conclusions when making [[Inferential_Statistics]] about the target population based on the sample data. The mechanical process involves identifying and minimizing these errors to ensure the sample is representative, thereby allowing for accurate [[Parameter_Estimation]].

# 3. Confounding Variables & Bias
When categorizing sampling errors, it's crucial to consider boundary conditions and failure states such as [[Non_Response_Bias]], [[Selection_Bias]], and [[Specification_Error]], which can severely compromise the validity of the study. For instance, if certain subgroups within the population are systematically less likely to respond to the survey, this [[Non_Response_Error]] can skew the results. Similarly, [[Selection_Error]] occurs when the wrong subsets of the population are chosen for the study, either intentionally or unintentionally, leading to a sample that doesn't accurately represent the target population. Moreover, [[Population_Specification_Error]] happens when there's a mismatch between the defined population and the actual population of interest, introducing a significant confounding variable that biases the results. Understanding these errors helps in designing studies that minimize such biases.
# 4. Probability Distribution
```markdown
| Error Type | Description | Effect on Sample |
| --- | --- | --- |
| Non-Response Bias | Certain subgroups are less likely to respond | Overrepresentation of responsive subgroups |
| Selection Bias | Wrong subsets of the population are chosen | Sample does not accurately represent the target population |
| Specification Error | Mismatch between defined and actual population | Confounding variables introduced, biasing results |
| Sampling Frame Error | Mismatch between target population and sample frame | Sample does not accurately represent the target population |
```

To read this table: The table categorizes different types of sampling errors, their descriptions, and the effects they have on the sample. Understanding these errors is crucial for ensuring that a sample accurately represents the target population.

## 5. Walkthrough
Let's consider a scenario where a researcher wants to study the average height of all adults in a country.

1. **Define Target Population**: The target population is all adults in the country.
2. **Identify Potential Sampling Errors**: The researcher realizes that using a sample frame that only includes adults who have a social media account might not accurately represent all adults, especially those who do not use social media.
3. **Selection of Sample Frame**: The researcher decides to use a sample frame that includes all registered voters, assuming most adults are registered to vote.
4. **Data Collection**: A sample of 1,000 individuals is randomly selected from the sample frame, and their heights are measured.
5. **Analysis and Identification of Errors**: Upon analysis, it's noticed that the sample has a higher average height compared to known national averages. The researcher suspects a **Selection Bias** because the sample frame (registered voters) might skew towards a healthier, possibly more affluent population that is more likely to engage in the voting process.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Non-Response Bias occurs when certain subgroups of the population are systematically less likely to respond to a survey.",
    "answer": "True",
    "explanation": "This statement is true. Non-Response Bias is a type of sampling error that occurs when certain subgroups within the population are less likely to respond to a survey, potentially skewing the results."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher aims to study the favorite hobbies of all university students. The researcher only surveys students who are members of sports clubs. What type of sampling error is likely to occur?",
    "answer": "Selection Bias",
    "explanation": "This scenario describes a Selection Bias. By only surveying students who are members of sports clubs, the sample does not accurately represent all university students, as it excludes those not interested in sports or not part of any club."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how a Specification Error could affect the validity of a study aiming to estimate the average income of a city's residents.",
    "answer": "A Specification Error occurs when there is a mismatch between the defined population and the actual population of interest. In the context of estimating the average income of a city's residents, a Specification Error could happen if the study defines the population as all residents but inadvertently samples only those living in a specific, affluent neighborhood. This would introduce a confounding variable (neighborhood affluence) that biases the results, leading to an inaccurate estimation of the average income for the entire city. To mitigate this, it's crucial to ensure that the sample frame accurately reflects the target population.",
    "explanation": "The response demonstrates an understanding of Specification Error and its potential impact on study validity, along with a practical example and suggested mitigation strategy."
  }
]
```