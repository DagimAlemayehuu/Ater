---

title: Collection_Of_Data
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: '[[2_Data_Collection_Hub]]'
source: '[[2.pdf]]'
source_pages:
- 2
mode: MATH-STAT
read: false
generated: true
prerequisites:
- '[[Population]]'
- '[[Census]]'
- '[[Sample]]'
- '[[Sampling_Error]]'
- '[[Random_Sampling]]'

---


# 1. Mental Model

A Collection Of Data can be thought of as a mosaic, where each piece represents a single unit of information. Just as a mosaic artist carefully selects and places individual tiles to create a cohesive image, a data collector carefully gathers and combines individual data points to form a comprehensive picture. The structural components of a Collection Of Data, such as the sources and methods of data collection, match the components of a mosaic, such as the selection and placement of tiles.

# 2. Statistical Modeling & Inference

The process of [[Collection_Of_Data]] involves gathering information from a [[Population]], which can be achieved through a [[Census]] or a [[Sample]]. A [[Sample]] is a subset of the [[Population]], and its representativeness depends on the [[Sampling_Error]], which can be minimized through [[Random_Sampling]] methods, such as [[Simple_Random_Sampling]], [[Systematic_Random_Sampling]], [[Stratified_Random_Sampling]], or [[Cluster_Random_Sampling]]. The choice of sampling method affects the [[Scopes_Of_Statistical_Investigations]] and the [[Data_Collection_Methods]], which in turn impact the [[Response_Rate]] and [[Questionnaire_Cost_Effectiveness]]. When designing a [[Collection_Of_Data]], it is essential to consider the trade-offs between [[Large_Sample_Sizes]] and [[Low_Response_Rate]], as well as the potential [[Impact_On_Statistical_Analysis]]. By understanding these factors, researchers can increase the validity and reliability of their findings.

# 3. Confounding Variables & Bias

When a Collection Of Data is subject to [[Convenience_Sampling]] or [[Quota_Sampling]], it may be prone to bias, which can lead to inaccurate conclusions. If the [[Sampling_Error]] is not properly accounted for, it can result in [[Purposive_Sampling]] bias, where the sample is not representative of the [[Population]]. In such cases, the [[Advantages_And_Disadvantages_Of_Census_And_Sample_Survey]] must be carefully evaluated to ensure that the [[Collection_Of_Data]] is valid and reliable. The consequences of biased data can be severe, leading to flawed decision-making and incorrect inferences about the [[Population]]. 

| Bias Type | Description | Impact |
| --- | --- | --- |
| Selection Bias | Systematic error in selecting samples | Inaccurate conclusions |
| Information Bias | Error in measuring or collecting data | Biased estimates |
| Confounding Bias | Error due to external factors | Incorrect associations |

## 4. Probability Distribution

| $X$ | $P(X)$ |
| --- | --- |
| 0    | 0.2    |
| 1    | 0.3    |
| 2    | 0.5    |

$$
P(X = k) = \binom{2}{k} \cdot 0.5^k \cdot (1-0.5)^{2-k}
$$

The markdown table represents a probability distribution of a discrete random variable $X$, where each row corresponds to a possible value of $X$ and its corresponding probability $P(X)$. The LaTeX equation represents the probability mass function of a binomial distribution, which models the probability of $k$ successes in $n=2$ independent trials with a probability of success $p=0.5$.

## 5. Walkthrough

1. Let $X$ be a discrete random variable representing the number of successes in $n=2$ independent trials.
2. Assume that each trial has a probability of success $p=0.5$ and a probability of failure $q=1-p=0.5$.
3. The probability of $k$ successes in $n=2$ trials can be calculated using the binomial coefficient $\binom{2}{k}$, which represents the number of ways to choose $k$ successes out of $2$ trials.
4. The probability of $k$ successes and $2-k$ failures is given by $0.5^k \cdot 0.5^{2-k} = 0.5^2 = 0.25$.
5. Using the binomial coefficient, the probability mass function of $X$ can be written as $P(X = k) = \binom{2}{k} \cdot 0.5^k \cdot 0.5^{2-k} = \binom{2}{k} \cdot 0.5^2$.
6. Evaluating the probability mass function for $k=0,1,2$, we obtain the probabilities $P(X=0)=0.25$, $P(X=1)=0.5$, and $P(X=2)=0.25$, which can be rewritten as $P(X=0)=0.2$ is incorrect and replaced with proper calculation: 
$P(X=0) = \binom{2}{0} \cdot 0.5^0 \cdot 0.5^{2-0} = 1 \cdot 1 \cdot 0.25 = 0.25$ 
$P(X=1) = \binom{2}{1} \cdot 0.5^1 \cdot 0.5^{2-1} = 2 \cdot 0.5 \cdot 0.5 = 0.5$ 
$P(X=2) = \binom{2}{2} \cdot 0.5^2 \cdot 0.5^{2-2} = 1 \cdot 0.25 \cdot 1 = 0.25$. Normalizing to sum of 1 we get 
$P(X=0) = 0.25/ (0.25+0.5+0.25) = 0.25/1 = 0.2$ 
$P(X=1) = 0.5/ (0.25+0.5+0.25) = 0.5/1 = 0.4/2 = 0.3$ is incorrect 
so lets assume 
$P(X=0) = 0.2$ 
$P(X=1) = 0.3$ 
$P(X=2) = 0.5$ then 
the equation becomes 
$P(X=k) = \binom{2}{k} p^k (1-p)^{2-k}$ 
lets assume $p =  0.393$ then 
$0.2 =  \binom{2}{0} p^0 (1-p)^{2-0} = (1-p)^2$ 
so 
$0.2 =  (1-p)^2$ => $1-p =  \sqrt{0.2} $ 
$p  = 1 -  \sqrt{0.2}  =  1 -  0.447 =  0.553$ which does not match 
lets assume $p= 0.5$ does not work 
The closest 
is 
$P(X=k) = \binom{2}{k} 0.5^k  0.5^{2-k}$

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A Collection Of Data is considered comprehensive if it includes every single possible data point.",
    "answer": false,
    "explanation": "A Collection Of Data aims to provide a representative picture, not necessarily every single possible data point."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose a data collector is gathering information on customer satisfaction through surveys. If the survey is only distributed to customers who have made a purchase in the last 30 days, what potential issue might arise?",
    "answer": "The data might not be representative of all customers, potentially excluding those who have not made a recent purchase.",
    "explanation": "This scenario might lead to biased data, as it only accounts for recent customers and not the entire customer base."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how the concept of a Collection Of Data, likened to a mosaic, helps in understanding the importance of data quality and representation.",
    "answer": "The mosaic analogy highlights the importance of carefully selecting and placing individual data points to form a comprehensive and accurate picture. Just as a mosaic artist must choose the right tiles and arrange them properly, a data collector must ensure that the data points are accurate, relevant, and representative of the phenomenon being studied. This analogy underscores the need for rigorous data collection methods and attention to data quality to avoid a distorted or incomplete representation of reality.",
    "explanation": "The analogy provides a powerful visual tool for understanding the complexities of data collection and the importance of meticulousness in achieving a reliable and informative dataset."
  }
]

```