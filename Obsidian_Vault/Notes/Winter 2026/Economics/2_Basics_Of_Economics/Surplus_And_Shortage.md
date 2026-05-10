---
title: Surplus_And_Shortage
course: "Economics"
unit: '2'
semester: "Winter 2026"
mode: ECON-MICRO
type: atomic_note
hub: "[[2_Basics_Of_Economics_Hub]]"
source: "[[Inbox/Generated/Winter 2026/Economics/Chapter_2.pdf]]"
date: '2026-05-10'
prerequisites:
- "[[Market_Equilibrium]]"
source_pages:
- 55
- 56
generated: true
---

## 1. Mental Model

At a farmer's market, on a particular Saturday, there are 100 baskets of fresh strawberries available for sale, but only 80 customers are willing to buy them at the current price. This situation represents a surplus, where the quantity supplied (100 baskets) exceeds the quantity demanded (80 baskets). Conversely, if a severe storm had damaged the strawberry crop, leaving only 80 baskets available, but 100 customers wanting to buy them, a shortage would occur. This scenario illustrates the concepts of surplus and shortage in a simple market setting.

## 2. Foundational Concept

A surplus occurs when the quantity supplied of a good or service is greater than the quantity demanded, while a shortage arises when the quantity demanded exceeds the quantity supplied. The price elasticity of supply, given by $E_S = \frac{\Delta Q}{\Delta P} \cdot \frac{P}{Q}$ or $E_S = \frac{\Delta Q}{\Delta P} \cdot \frac{P_0 + P_1}{Q_0 + Q_1}$, measures how responsive the quantity supplied is to changes in price. [[Market_Equilibrium]] is closely related, as it is the point where quantity supplied equals quantity demanded. In a [[Law_Of_Supply]] context, suppliers are more willing to supply goods at higher prices, which can lead to surpluses if demand does not increase correspondingly. Understanding surpluses and shortages is crucial for analyzing [[Market_Demand]] and [[Demand_Curve]] dynamics.

### Key Takeaways:

- A surplus is present when quantity supplied is greater than quantity demanded.
- A shortage occurs when quantity demanded is greater than quantity supplied.
- The concept of surplus and shortage is essential for understanding market dynamics and Market Equilibrium.
- These concepts are critical in the study of Demand Schedule and Elasticity And Total Revenue.

## 3. Limitations & Edge Cases

The concepts of surplus and shortage assume that markets are perfectly competitive and that prices can adjust freely. However, in real-world scenarios, prices might be sticky due to various factors like [[Technological_Advancement]] or government interventions. Additionally, the availability of substitutes (see [[Determinants_Of_Price_Elasticity_Of_Demand]]) can affect how surpluses and shortages are resolved. Furthermore, time horizons in both demand and supply can influence the persistence of these states. These complexities highlight the need for nuanced analysis when applying these concepts to real-world markets.

## 4. Surplus and Shortage Diagram

```mermaid

graph LR

    | A[Quantity Supplied] -->|Greater Than| B[Quantity Demanded] 
    | B -->|Surplus| C[Market Glut] 
    | A -->|Less Than| D[Quantity Demanded] 
    | D -->|Shortage| E[Market Shortfall] 

    style C fill:#f9f,stroke:#333,stroke-width:4px
    style E fill:#f9f,stroke:#333,stroke-width:4px

```

## 5. Walkthrough

**Step 1:** In a market, the quantity supplied and quantity demanded interact to determine the market equilibrium.

**Step 2:** When the quantity supplied is greater than the quantity demanded, a surplus occurs, leading to a market glut.

**Step 3:** Conversely, when the quantity demanded exceeds the quantity supplied, a shortage arises, resulting in a market shortfall.

**Step 4:** Understanding surpluses and shortages is crucial for analyzing market dynamics and making informed decisions.

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "type": "fill_in",
    "question": "A market situation in which the quantity supplied of a good or service is greater than the quantity demanded is known as a [[blank]].",
    "answer": "surplus",
    "explanation": "A surplus occurs when the quantity supplied exceeds the quantity demanded, leading to a market glut.",
    "textWithBlanks": "A market situation in which the quantity supplied of a good or service is greater than the quantity demanded is known as a [[blank]]."
  },
  {
    "type": "mcq",
    "question": "What happens when the quantity demanded of a good or service exceeds the quantity supplied?",
    "options": {
      "a": "A surplus occurs",
      "b": "A shortage occurs",
      "c": "Market equilibrium is achieved",
      "d": "The law of supply is violated"
    },
    "answer": "b",
    "explanation": "When quantity demanded exceeds quantity supplied, a shortage arises, leading to a market shortfall."
  },
  {
    "type": "trace",
    "question": "Trace the causal chain from a surplus to its market outcome.",
    "steps": [
      "Quantity supplied is greater than quantity demanded",
      "Suppliers are unable to sell all their goods or services",
      "Downward pressure on prices ensues",
      "Buyers become more willing to purchase the good or service"
    ],
    "answer": "A decrease in price",
    "explanation": "A surplus leads to downward pressure on prices, making the good or service more attractive to buyers, which in turn leads to a decrease in price."
  }
]

```