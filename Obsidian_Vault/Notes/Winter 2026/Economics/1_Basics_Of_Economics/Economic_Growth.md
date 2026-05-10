---
title: "Economic_Growth"
course: "Economics"
unit: "1"
semester: "Winter 2026"
mode: "ECON-MICRO"
type: "atomic_note"
hub: "[[1_Basics_Of_Economics_Hub]]"
source: "[[Inbox/Generated/Winter 2026/Economics/Chapter_1.pdf]]"
date: "2026-05-10"
prerequisites:
 - "Production Possibilities Frontier (ppf)"
source_pages:
 - "48"
 - "49"
generated: true
read: true
---

## 1. Mental Model

In a small village, the local farmers experience a significant increase in crop yields due to the introduction of a new, high-quality seed variety. This improvement in agricultural productivity allows the village to produce more food with the same amount of labor and land, leading to an increase in the total output of goods and services. As a result, the villagers have more resources available to invest in other areas, such as education and infrastructure. The village's economy is growing, and the standard of living is likely to improve.

## 2. Quantitative Model

Economic growth occurs when there is an increase in the total output level of an economy, which can happen in two main ways. Firstly, an increase in the quantity or quality of economic resources, such as labor, capital, or natural resources, can lead to economic growth. For example, an increase in the workforce or an improvement in the skills and education of workers can lead to higher productivity. Secondly, advances in technology can also drive economic growth by enabling the production of more goods and services with the same amount of resources. This is often achieved through the adoption of [[Capital_Intensive_Techniques]] or [[Labour_Intensive_Techniques]]. The Production Possibilities Frontier (ppf) illustrates the various combinations of goods and services that can be produced given the available resources and technology. Economic growth is closely related to [[Scarcity]], as it involves finding ways to produce more goods and services despite [[Limited_Resources]].

### Key Takeaways:

- The quantity as well as quality of economic resources available for use during the year can be fixed, but economic growth can still occur through advances in technology.
- A nuance is that economic growth can be driven by either an increase in the quantity of resources or an improvement in their quality.
- Understanding economic growth is crucial for addressing Basic Economic Questions, such as how to allocate resources efficiently and promote economic development.

## 3. Limitations & Edge Cases

However, the concept of economic growth has several limitations. For instance, it does not account for the distribution of income or the environmental impact of economic activity. Additionally, economic growth may be accompanied by [[Market_Failure]], such as the depletion of natural resources or the degradation of the environment. Furthermore, the assumption of Unlimited Wants may not always hold, as people's preferences and values can change over time. Therefore, policymakers must consider these limitations when designing strategies to promote economic growth.

## 4. Economic Growth Model

$Y = f(L, K, A)$

```mermaid

graph LR

    | A[Increase in Labor (L)] -->|Leads to| B[Increase in Output (Y)] 
    | C[Increase in Capital (K)] -->|Leads to| B 
    | D[Advances in Technology (A)] -->|Leads to| B 
    | B -->|Economic Growth| E[Improved Standard of Living]

```

## 5. Walkthrough

**Step 1:** Economic growth can be represented by the function $Y = f(L, K, A)$, where $Y$ is the total output, $L$ is labor, $K$ is capital, and $A$ represents technology.

**Step 2:** An increase in labor ($L$) or capital ($K$) can lead to an increase in output ($Y$).

**Step 3:** Advances in technology ($A$) can also lead to an increase in output ($Y$) by making production more efficient.

**Step 4:** As output ($Y$) increases, the economy experiences economic growth.

**Step 5:** Economic growth ultimately leads to an improved standard of living.

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "type": "fill_in",
    "question": "Economic growth can occur through an increase in the quantity or quality of economic resources, such as labor, capital, or natural resources, or through [[blank]].",
    "answer": "advances in technology",
    "explanation": "Advances in technology can enable the production of more goods and services with the same amount of resources, leading to economic growth.",
    "textWithBlanks": "Economic growth can occur through an increase in the quantity or quality of economic resources, such as labor, capital, or natural resources, or through [[blank]]."
  },
  {
    "type": "mcq",
    "question": "Which of the following can lead to economic growth?",
    "options": {
      "a": "Decrease in labor",
      "b": "Increase in capital",
      "c": "Decrease in technology",
      "d": "Increase in scarcity"
    },
    "answer": "b",
    "explanation": "An increase in capital, such as an increase in the stock of machines or buildings, can lead to economic growth by enabling the production of more goods and services.",
    "optionsValid": [
      "Increase in labor",
      "Increase in capital",
      "Advances in technology"
    ]
  },
  {
    "type": "trace",
    "question": "Trace the causal chain from an increase in labor to economic growth.",
    "steps": [
      "An increase in labor occurs",
      "This leads to an increase in the total output level",
      "As output increases, the economy experiences economic growth",
      "Economic growth ultimately leads to an improved standard of living"
    ],
    "answer": "Improved standard of living",
    "explanation": "An increase in labor can lead to an increase in output, which can drive economic growth and ultimately improve the standard of living."
  }
]
```