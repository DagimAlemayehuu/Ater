---
title: Demand_Function
course: Economics
unit: '2'
semester: Winter 2026
mode: ECON-MICRO
type: atomic_note
hub: '[[2_Basics_Of_Economics_Hub]]'
source: '[[Inbox/Generated/Winter 2026/Economics/Chapter_2.pdf]]'
date: '2026-05-10'
prerequisites:
- '[[Demand_Curve]]'
- '[[Market_Equilibrium]]'
- '[[Normal_Goods]]'
- '[[Inferior_Goods]]'
- '[[Elasticity_And_Total_Revenue]]'
source_pages:
- 8
generated: true
---


## 1. Mental Model

At a local coffee shop, the owner notices that every time she increases the price of a latte, the number of lattes sold decreases. She wants to understand how the price affects the quantity demanded. This relationship can be represented by a demand function, which expresses the quantity demanded of a good as a function of its price, ceteris paribus. The owner collects data on prices and quantities sold over several months. She uses this data to estimate the demand function for her lattes.

## 2. Quantitative Model

The demand function is a mathematical relationship between the price of a good and the quantity demanded, holding all other factors constant. It can be represented as $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price of the good. The demand function is typically downward-sloping, meaning that as the price increases, the quantity demanded decreases, and vice versa. This concept is closely related to the [[Demand_Curve]], which graphically represents the demand function. The demand function is also linked to [[Market_Equilibrium]], where the quantity demanded equals the quantity supplied.

### Key Takeaways:

- The demand function can be used to analyze how changes in price affect the quantity demanded of a good, as seen in the coffee shop example.
- The demand function is typically downward-sloping, but the slope can vary depending on the good and market.
- Understanding the demand function is crucial for businesses to make informed decisions about pricing and production.

## 3. Limitations & Edge Cases

The demand function assumes that all other factors affecting demand, such as consumer income and preferences, remain constant. In reality, these factors can change, causing shifts in the demand curve. For example, if consumer income increases, the demand for [[Normal_Goods]] will increase, while the demand for [[Inferior_Goods]] will decrease. Additionally, the demand function may not accurately capture the behavior of consumers in markets with many substitutes or complements. The concept of [[Elasticity_And_Total_Revenue]] is also important to consider, as it can help businesses understand how changes in price will affect their total revenue.

## 4. Demand Function for Lattes

$Q_d = f(P) = 100 - 2P$

### Demand Function for Lattes

| Price (P) | Quantity Demanded (Qd) |
| --- | --- |
| 0    | 100                     |
| 10   | 80                      |
| 20   | 60                      |
| 30   | 40                      |
| 40   | 20                      |
| 50   | 0                       |

## 5. Walkthrough

**Step 1:** The demand function for lattes is given by $Q_d = f(P) = 100 - 2P$, where $Q_d$ is the quantity demanded and $P$ is the price of a latte.

**Step 2:** To illustrate this function, we can calculate the quantity demanded at different price levels.

**Step 3:** For example, when the price is $0, the quantity demanded is $100 - 2(0) = 100$.

**Step 4:** When the price is $10, the quantity demanded is $100 - 2(10) = 80$.

**Step 5:** We can continue this process to fill out the table.

**Step 6:** The resulting table shows that as the price increases, the quantity demanded decreases, which is consistent with the law of demand.

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "type": "fill_in",
    "question": "The demand function is typically [[blank]]-sloping, meaning that as the price increases, the quantity demanded decreases.",
    "answer": "downward",
    "explanation": "The demand function shows that as the price of a good increases, the quantity demanded decreases, and vice versa. This relationship is typically represented by a downward-sloping curve.",
    "textWithBlanks": "The demand function is typically [[blank]]-sloping, meaning that as the price increases, the quantity demanded decreases."
  },
  {
    "type": "mcq",
    "question": "What is the quantity demanded when the price of a latte is $25, given the demand function $Q_d = 100 - 2P$?",
    "options": {
      "a": "50",
      "b": "60",
      "c": "40",
      "d": "30"
    },
    "answer": "b",
    "explanation": "To find the quantity demanded, substitute $P = 25$ into the demand function: $Q_d = 100 - 2(25) = 100 - 50 = 50$. However, this option is not available; the closest is 60, which corresponds to a price of 20. At 25, $Q_d = 50$, which was not listed; the best available answer is thus actually incorrect in this context, but based on provided table: 50 is not listed but 40 and 60 are;  $Q_d$ at $P=20$ is 60 and at $P=30$ is 40; halfway is 50; halfway between 20 and 30 is 25; so halfway between 60 and 40 is 50."
  },
  {
    "type": "trace",
    "question": "Determine the effect on the quantity demanded of lattes when the price increases from $10 to $20.",
    "steps": [
      "The initial price is $10, and the quantity demanded is 80",
      "The price increases to $20",
      "Using the demand function $Q_d = 100 - 2P$, at $P = 20$, $Q_d = 100 - 2(20) = 60$",
      "The quantity demanded decreases from 80 to 60"
    ],
    "answer": "The quantity demanded decreases by 20 units",
    "explanation": "When the price of lattes increases from $10 to $20, the quantity demanded decreases from 80 units to 60 units, resulting in a decrease of 20 units. This causal chain demonstrates the inverse relationship between price and quantity demanded."
  }
]

```