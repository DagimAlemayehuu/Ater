---
title: Demand_Schedule
course: Economics
unit: '2'
semester: Winter 2026
mode: ECON-MICRO
type: atomic_note
hub: '[[2_Basics_Of_Economics_Hub]]'
source: '[[Inbox/Generated/Winter 2026/Economics/Chapter_2.pdf]]'
date: '2026-05-10'
prerequisites:
- '[[Market_Equilibrium]]'
- '[[Demand_Curve]]'
- '[[Elasticity_And_Total_Revenue]]'
- '[[Arc_Elasticity_Of_Demand]]'
- '[[Substitute_Goods]]'
source_pages:
- 6
- 7
generated: true
---


## 1. Mental Model

At a local farmer's market, the price of oranges varies from day to day, influencing how many kilograms of oranges customers are willing to buy. On one day, if the price per kilogram is $5, customers buy 5 kilograms. If the price drops to $4, they buy 7 kilograms. This scenario illustrates how the quantity of a commodity demanded changes with its price, which is captured in a demand schedule.

## 2. Process Architecture

A demand schedule is a list of the various quantities of a commodity an individual consumer or market purchases at different levels of prices. It is represented by the function $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price of the commodity. For instance, consider a linear demand function: $Q = a + bp$. Using the example of oranges, if at a price of $4 the quantity demanded is 7 kilograms, and at $5 it is 5 kilograms, the slope of the demand curve, $b$, is calculated as $\frac{\Delta Q}{\Delta P} = \frac{7-5}{4-5} = -2$. The intercept $a$ can then be determined from $7 = a - 2*4$, which helps in understanding the demand function for oranges. This concept is crucial for analyzing [[Market_Equilibrium]], understanding the [[Demand_Curve]], and further exploring [[Elasticity_And_Total_Revenue]].

### Key Takeaways:

- The slope of the demand curve for oranges is -2, indicating that for every dollar increase in price, the quantity demanded decreases by 2 kilograms.
- A demand schedule helps in visualizing the relationship between the price of a commodity and the quantity demanded, which is essential for businesses and policymakers.
- Understanding demand schedules is vital for explaining [[Arc_Elasticity_Of_Demand]] and how changes in price affect the quantity demanded of different goods.

## 3. Limitations & Edge Cases

The demand schedule assumes ceteris paribus, meaning all other factors that could influence demand are held constant. However, in reality, factors such as changes in consumer income, tastes, or prices of [[Substitute_Goods]] can shift the demand curve. Additionally, the demand schedule may not accurately predict demand for goods with complex or dynamic pricing structures. Furthermore, it does not account for the [[Determinants_Of_Elasticity_Of_Supply]], which can influence market equilibrium. Therefore, while demand schedules are a fundamental tool in economics, they must be used with an understanding of their limitations.

## 4. Demand Schedule for Oranges

$Q_d = a + bP$

| Price ($/kg) | Quantity Demanded (kg) |
| --- | --- |
| 4 | 7 |
| 5 | 5 |

## 5. Walkthrough

**Step 1:** Tabulate the inverse relationship between Price ($P$) and Quantity Demanded ($Q$) to identify the discrete points of the schedule.

**Step 2:** Recall the given example where at a price of $4/kg, 7 kg of oranges are demanded, and at $5/kg, 5 kg are demanded.

**Step 3:** Calculate the slope (b) of the demand curve using the formula $b = \frac{\Delta Q}{\Delta P} = \frac{7-5}{4-5} = -2$.

**Step 4:** Determine the intercept (a) of the demand curve using one of the points, for example, $7 = a - 2*4$, which simplifies to $a = 7 + 8 = 15$.

**Step 5:** Write the demand function as $Q_d = 15 - 2P$.

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "type": "fill_in",
    "question": "A list of the various quantities of a commodity an individual consumer or market purchases at different levels of prices is called a [[blank]].",
    "answer": "demand schedule",
    "explanation": "A demand schedule is a table or list that shows the quantity demanded of a good at different price levels.",
    "textWithBlanks": "A list of the various quantities of a commodity an individual consumer or market purchases at different levels of prices is called a [[blank]]."
  },
  {
    "type": "mcq",
    "question": "What is the slope of the demand curve for oranges given that at a price of $4/kg, 7 kg are demanded, and at $5/kg, 5 kg are demanded?",
    "options": {
      "a": "-1",
      "b": "-2",
      "c": "-3",
      "d": "1"
    },
    "answer": "b",
    "explanation": "The slope of the demand curve is calculated as $b = \\frac{\\Delta Q}{\\Delta P} = \\frac{7-5}{4-5} = -2$."
  },
  {
    "type": "trace",
    "question": "Determine the demand function for oranges given two points on the demand curve.",
    "steps": [
      "The quantity demanded at $4/kg is 7 kg and at $5/kg is 5 kg",
      "Calculate the slope (b) of the demand curve: $b = \\frac{7-5}{4-5} = -2$",
      "Use one point to find the intercept (a): $7 = a - 2*4$",
      "Solve for a: $a = 7 + 8 = 15$",
      "Write the demand function: $Q_d = 15 - 2P$"
    ],
    "answer": "$Q_d = 15 - 2P$",
    "explanation": "By following these steps, we derive the demand function that relates the price of oranges to the quantity demanded."
  }
]

```