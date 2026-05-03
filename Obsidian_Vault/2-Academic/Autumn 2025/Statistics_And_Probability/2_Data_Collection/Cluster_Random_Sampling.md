---
title: Cluster_Random_Sampling
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 28
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Random_Sampling]]"
---

# 1. Mental Model
Imagine you're trying to understand the favorite ice cream flavors of all the kids in a large school. Instead of randomly picking kids from the entire school, you first divide the school into smaller groups, like classrooms. Then, you randomly select a few classrooms and ask every kid in those classrooms about their favorite ice cream flavor. This approach is similar to Cluster Random Sampling, where you divide the population into clusters and then randomly select some of those clusters to be included in your sample.

# 2. Statistical Modeling & Inference
Cluster Random Sampling works by first dividing the population into [[Non-Overlapping]] clusters, which could be geographic regions, schools, or any other grouping. Then, a random sample of these clusters is selected, and either all units within the selected clusters are sampled or a random sample of units within those clusters is taken. This method is particularly useful when it's impractical or expensive to sample from the entire population directly. The [[Intra-Cluster]] variability and [[Inter-Cluster]] variability are crucial in determining the efficiency of the cluster sampling design. The [[Design Effect]] is a measure used to compare the variance of a cluster sample to the variance of a simple random sample, helping to assess the loss of precision due to clustering.

# 3. Confounding Variables & Bias
When using Cluster Random Sampling, there's a risk of [[Cluster Bias]] if the clusters are not representative of the population. For instance, if certain clusters have unique characteristics that differ significantly from the population as a whole, the sample may not accurately reflect the population's attributes. Additionally, the method assumes that the clusters are [[Homogeneous]] within themselves, which might not always be the case. If the clusters are highly heterogeneous, the risk of [[Sampling Bias]] increases. It's also important to consider the [[Sampling Frame]] and ensure it accurately represents the population to avoid [[Non-Response Bias]] and other forms of bias that could affect the validity of the inferences made from the sample.
# 4. Probability Distribution
```markdown
| Cluster | Probability of Selection |
| --- | --- |
| 1    | 1/5                     |
| 2    | 1/5                     |
| 3    | 1/5                     |
| 4    | 1/5                     |
| 5    | 1/5                     |
```
To read this table, we consider a scenario where a population is divided into 5 clusters, and 1 cluster is randomly selected for the sample. Each cluster has an equal chance of being selected, with a probability of 1/5 or 0.2.

## 5. Walkthrough
Let's walk through a scenario where we apply Cluster Random Sampling:

1. **Divide the Population into Clusters**: A university wants to survey its students about their satisfaction with the cafeteria food. The university is divided into 5 colleges: Engineering, Business, Arts, Science, and Law.

2. **Determine the Sample Size and Clusters**: The university decides to sample 2 colleges out of the 5.

3. **Randomly Select Clusters**: The 5 colleges are numbered 1 to 5. Using a random number generator, we select 2 colleges: 2 (Business) and 4 (Science).

4. **Sample within Selected Clusters (if necessary)**: Within the Business and Science colleges, the university decides to survey all students.

5. **Analyze Data**: The survey results from the Business and Science colleges are analyzed to understand student satisfaction with the cafeteria food.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "In Cluster Random Sampling, clusters are typically overlapping to ensure representation.",
    "answer": "False",
    "explanation": "Clusters in Cluster Random Sampling are typically non-overlapping to ensure that each unit in the population belongs to only one cluster."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A marketing firm wants to understand consumer behavior in different regions. They divide the country into 10 regions and randomly select 3 regions to survey. What type of sampling is this?",
    "answer": "Cluster Random Sampling",
    "explanation": "This is an example of Cluster Random Sampling because the country is divided into regions (clusters), and a random sample of these regions is selected for the survey."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how Cluster Random Sampling could be used in a study to assess the effectiveness of a new educational program implemented in various schools across a district. Describe the steps involved and potential biases to consider.",
    "answer": "Cluster Random Sampling can be used by first dividing the district into schools (clusters). Then, a random sample of schools is selected. Within these selected schools, either all students or a random sample of students who have undergone the new educational program are assessed. The steps involve: (1) defining the population and clusters (schools), (2) randomly selecting schools, (3) assessing the students within selected schools. Potential biases include cluster bias if certain schools are not representative, and sampling bias if there's high heterogeneity within schools.",
    "explanation": "This question assesses the ability to apply Cluster Random Sampling in a complex scenario and consider its limitations."
  }
]
```