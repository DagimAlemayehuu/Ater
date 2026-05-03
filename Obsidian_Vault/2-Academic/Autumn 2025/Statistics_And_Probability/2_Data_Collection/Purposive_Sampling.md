---

title: Purposive_Sampling
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: '[[2_Data_Collection_Hub]]'
source: '[[2.pdf]]'
source_pages:
- 41
mode: MATH-STAT
read: false
generated: true
prerequisites:
- '[[Collection_Of_Data]]'
- '[[Sample]]'
- '[[Random_Sampling]]'
- '[[Population]]'
- '[[Sampling_Error]]'

---


# 1. Mental Model

The concept of purposive sampling can be likened to a skilled curator selecting exhibits for an art gallery, where the curator's expertise is used to hand-pick items that best represent the theme or characteristics of interest, much like how a researcher uses their judgment to select participants that are most informative for the study. Just as the curator's goal is to showcase a representative collection, not a random one, the researcher aims to gather a sample that is purposefully chosen for its relevance. This analogy maps the structural components of purposive sampling, such as the researcher's expert judgment and the goal of representation, to the curator's selection process and the goal of thematic representation.

# 2. Statistical Modeling & Inference

Purposive sampling is a non-probability [[Collection_Of_Data]] method where the researcher selects a [[Sample]] based on their expert judgment or purpose, rather than using [[Random_Sampling]] techniques. This approach is often used when the researcher wants to study a specific subgroup within a [[Population]], and they have knowledge about the characteristics of that subgroup. However, this method can introduce [[Sampling_Error]] and [[Bias]] into the study, as the sample may not be representative of the larger [[Population]]. In contrast to [[Simple_Random_Sampling]], [[Systematic_Random_Sampling]], [[Stratified_Random_Sampling]], and [[Cluster_Random_Sampling]], purposive sampling does not provide a [[Probability]] of selection for each unit, which can limit the [[Scopes_Of_Statistical_Investigations]] and the [[Advantages_And_Disadvantages_Of_Census_And_Sample_Survey]]. When using purposive sampling, researchers should be aware of the potential [[Impact_On_Statistical_Analysis]] and consider the [[Cost_Comparison]] with other [[Data_Collection_Methods]].

# 3. Confounding Variables & Bias

Purposive sampling can be prone to bias if the researcher's judgment is flawed or influenced by [[Confounding_Variables]], leading to a [[Sample]] that is not representative of the [[Population]]. If the researcher has a preconceived notion about the characteristics of the subgroup of interest, this can result in a biased [[Sample]] selection. The boundary conditions for purposive sampling include the researcher's expertise and knowledge of the [[Population]], as well as the [[Response_Rate]] and potential [[Questionnaire_Limitations]]. 

| Bias Type | Description | 
| --- | --- | 
| Selection Bias | Occurs when the sample is not representative of the population | 
| Confirmation Bias | Occurs when the researcher selects participants that confirm their preconceived notions | 
| Social Desirability Bias | Occurs when participants respond in a way that they think is socially desirable | 

In purposive sampling, failure to account for these biases can lead to flawed conclusions and inferences about the [[Population]].

## 4. Probability Distribution

The probability distribution for a purposive sampling can be represented using a simple table and LaTeX equation.

| Outcome | Probability |
|---------|------------|
| $X = 1$ | $p$        |
| $X = 0$ | $1-p$      |

$$
P(X = x) = p^x (1-p)^{1-x}
$$

The table represents the possible outcomes of a purposive sampling, where $X = 1$ indicates a successful selection and $X = 0$ indicates a non-successful selection. The LaTeX equation represents the probability mass function of a Bernoulli distribution, which models the probability of each outcome.

## 5. Walkthrough

Here are the steps to derive the probability distribution for purposive sampling:

1. Define the random variable $X$ as an indicator of a successful selection, where $X = 1$ if the selection is successful and $X = 0$ otherwise.
2. Assume that the probability of a successful selection is $p$, where $0 \leq p \leq 1$.
3. The probability of a non-successful selection is $1-p$, since the probabilities must sum to 1.
4. The probability mass function of $X$ can be written as $P(X = x) = P(X = 1)^x P(X = 0)^{1-x}$.
5. Substituting $P(X = 1) = p$ and $P(X = 0) = 1-p$, we get $P(X = x) = p^x (1-p)^{1-x}$.
6. This is the probability mass function of a Bernoulli distribution, which models the probability of each outcome in a purposive sampling.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "In purposive sampling, is the goal to randomly select participants?",
    "answer": false,
    "explanation": "Purposive sampling involves selecting participants based on the researcher's judgment about which participants will be most useful or informative, rather than random selection."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher is studying the experiences of entrepreneurs who have successfully launched their own startups. The researcher uses purposive sampling to select participants who are well-known in the industry and have a track record of innovation. What potential limitation might this approach have?",
    "answer": "The sample may not be representative of entrepreneurs who are less well-known or have had less success, potentially limiting the generalizability of the findings.",
    "explanation": "While the researcher may gain rich insights from the selected participants, the sample's lack of diversity and potential biases towards successful entrepreneurs might limit the study's external validity."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how purposive sampling can be used to study a hard-to-reach population, such as individuals with a rare medical condition.",
    "answer": "Purposive sampling can be particularly useful when studying hard-to-reach populations, such as individuals with a rare medical condition. The researcher can use their expertise and knowledge of the population to identify and select participants who are most likely to provide valuable insights. For example, the researcher might use snowball sampling, where current participants are asked to recommend others who might be willing to participate. Additionally, the researcher might use specialized sampling frames, such as patient registries or support groups, to identify potential participants. By using purposive sampling, the researcher can increase the chances of obtaining a sample that is representative of the population and provides meaningful data.",
    "explanation": "This approach allows the researcher to leverage their expertise and existing networks to access a population that might be difficult to reach through traditional sampling methods."
  }
]

```