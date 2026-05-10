---
title: "Law_Of_Increasing_Opportunity_Cost"
course: "Economics"
unit: "1"
semester: "Winter 2026"
mode: "ECON-MICRO"
type: "atomic_note"
hub: "[[1_Basics_Of_Economics_Hub]]"
source: "[[Inbox/Generated/Winter 2026/Economics/Chapter_1.pdf]]"
date: "2026-05-10"
prerequisites:
 - "[[Opportunity_Cost]]"
source_pages:
 - "47"
generated: true
read: true
---

## 1. Mental Model

In a hypothetical economy that produces food and computers, given its limited resources and available technology, the government decides to increase food production to meet growing demand. As a result, resources such as labor and capital are shifted from computer production to food production. At first, the opportunity cost of producing more food is low, as resources can be easily reallocated. However, as food production continues to increase, the economy faces a trade-off, and the opportunity cost of producing one more unit of food rises.

## 2. Causal Mechanism

The Law of Increasing Opportunity Cost states that as the production of one good or service increases, the opportunity cost of producing an additional unit of that good or service also increases. This concept is illustrated using a production possibility frontier (PPF), which describes the various combinations of two goods or services that can be produced given the available resources and technology [[Scarcity]]. The PPF shows that as the economy produces more of one good, it must give up increasing amounts of the other good, reflecting the increasing opportunity cost [[Opportunity_Cost]]. For example, if the economy produces more food, it must use more resources, which are diverted from computer production, leading to a higher opportunity cost [[Limited_Resources]]. This concept is essential in understanding the [[Basic_Economic_Questions]] of what goods and services to produce.

### Key Takeaways:

- The production possibility frontier (PPF) illustrates the concept of increasing opportunity cost, showing that as the economy produces more of one good, it must give up increasing amounts of the other good.
- The opportunity cost of producing one more unit of a good or service increases as its production increases, due to the limited availability of resources Limited Resources.
- Understanding the Law of Increasing Opportunity Cost is crucial in making informed decisions about resource allocation and Economic Growth.

## 3. Limitations & Edge Cases

The Law of Increasing Opportunity Cost assumes that resources are not perfectly adaptable to alternative uses and that the economy operates under conditions of [[Scarcity]]. However, in reality, resources can be reallocated, and technological advancements can reduce the opportunity cost of producing certain goods or services. Additionally, the concept does not account for [[Market_Failure]], which can lead to inefficient allocation of resources. The Law of Increasing Opportunity Cost also assumes a simple two-good model, which may not accurately represent real-world economies with multiple goods and services. Therefore, the concept should be applied with caution in real-world scenarios.

## 4. Production Possibility Frontier (PPF) for Food and Computers

$Opportunity\ Cost = \Delta Food\ Production / \Delta Computer\ Production$

```mermaid

graph LR

    | A[Food Production] -->|Increased Resources| B(Food Production Increase) 
    | B -->|Trade-off| C(Computer Production Decrease) 
    | C -->|Opportunity Cost| D(Opportunity Cost Increase) 
    | D -->|Limited Resources| E[Computer Production] 
    | E -->|Scarcity| A

```

## 5. Walkthrough

**Step 1:** The production possibility frontier (PPF) illustrates the trade-off between food and computer production.

**Step 2:** As food production increases, resources are diverted from computer production, leading to a decrease in computer production.

**Step 3:** The opportunity cost of producing more food is the decrease in computer production, which increases as food production continues to rise.

**Step 4:** The PPF shows that as the economy produces more food, it must give up increasing amounts of computer production, reflecting the increasing opportunity cost.

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "type": "fill_in",
    "question": "The concept that as the production of one good or service increases, the opportunity cost of producing an additional unit of that good or service also increases is known as the Law of [[blank]].",
    "answer": "Increasing Opportunity Cost",
    "explanation": "The Law of Increasing Opportunity Cost states that as the production of one good or service increases, the opportunity cost of producing an additional unit of that good or service also increases.",
    "textWithBlanks": "The concept that as the production of one good or service increases, the opportunity cost of producing an additional unit of that good or service also increases is known as the Law of [[blank]]."
  },
  {
    "type": "mcq",
    "question": "What happens to the opportunity cost of producing more of one good as its production increases?",
    "options": {
      "a": "It decreases due to economies of scale",
      "b": "It remains constant due to fixed resources",
      "c": "It increases due to the need to divert resources from other goods",
      "d": "It becomes irrelevant due to technological advancements"
    },
    "answer": "c",
    "explanation": "As the production of one good increases, resources are diverted from the production of another good, leading to an increase in the opportunity cost."
  },
  {
    "type": "trace",
    "question": "Trace the causal chain from an increase in food production to the opportunity cost of producing computers.",
    "steps": [
      "An increase in food production requires more resources",
      "These resources are diverted from computer production",
      "The diversion of resources leads to a decrease in computer production",
      "The decrease in computer production represents an increase in the opportunity cost of producing food"
    ],
    "answer": "An increase in the opportunity cost of producing computers",
    "explanation": "The causal chain illustrates how an increase in food production leads to an increase in the opportunity cost of producing computers, demonstrating the Law of Increasing Opportunity Cost."
  }
]
```