---
title: Change_In_Demand
course: "Economics"
unit: '2'
semester: "Winter 2026"
mode: ECON-MICRO
type: atomic_note
hub: "[[2_Basics_Of_Economics_Hub]]"
source: "[[Inbox/Generated/Winter 2026/Economics/Chapter_2.pdf]]"
date: '2026-05-10'
prerequisites:
- "[[Demand_Curve]]"
source_pages:
- 14
- 15
generated: true
---

## 1. Mental Model

The price of oranges at a local market increases from $4 to $5 per kilogram. As a result, the quantity demanded decreases from 7 kilograms to 5 kilograms. This change in price and quantity demanded illustrates a change in demand. The relationship between price and quantity demanded is fundamental to understanding demand behavior.

## 2. Causal Mechanism

The change in demand refers to a shift in the demand curve, which occurs when any determinant of demand, except for the good's price, changes. The demand function $Q_d = f(P)$ shows that the quantity demanded $Q_d$ is a function of the price $P$ of the commodity. However, when other factors change, the entire demand curve shifts. For instance, consider a linear demand function: $Q = a + bp$, where $b = \frac{\Delta Q}{\Delta P}$. Using the example from the source, $b = \frac{7-5}{4-5} = -2$. This indicates that for every unit increase in price, the quantity demanded decreases by 2 units. A change in demand is distinct from a change in quantity demanded, which occurs when the price of the good changes, ceteris paribus [[Demand_Curve]]. [[Market_Demand]] and [[Demand_Function]] are crucial concepts in understanding these dynamics.

### Key Takeaways:

- The slope of the demand curve for oranges is -2, indicating that for every dollar increase in price, the quantity demanded decreases by 2 kilograms.
- A change in demand occurs when factors other than price change, causing a shift in the demand curve.
- Understanding changes in demand is essential for businesses and policymakers to make informed decisions about production and pricing strategies [[Demand_Schedule]].

## 3. Limitations & Edge Cases

The ceteris paribus assumption is crucial in analyzing changes in demand, but in reality, many factors can change simultaneously, making it challenging to isolate the effect of a single determinant. Additionally, the linear demand function assumes a constant slope, which may not hold in all cases, as the relationship between price and quantity demanded can be non-linear. Furthermore, changes in demand can be influenced by various factors, such as [[Technological_Advancement]] and [[Substitute_Goods]], which can affect consumer preferences and purchasing power.

## 4. Demand Curve Analysis

$Q_d = a + bp$

```mermaid

graph LR

    | A[Price Increase] -->|Decrease Quantity Demanded| B 
    | B -->|Shift Along Demand Curve| C[Change in Quantity Demanded] 
    | D[Change in Income] -->|Increase/Decrease Demand| E 
    | E -->|Shift Demand Curve| F[Change in Demand] 
    | F -->|New Equilibrium| G

```

## 5. Walkthrough

**Step 1:** The initial demand curve is represented by the equation $Q_d = a + bp$.

**Step 2:** When the price increases, the quantity demanded decreases, illustrating a movement along the demand curve, which is a change in quantity demanded.

**Step 3:** A change in demand occurs when factors other than price, such as income, change, causing the entire demand curve to shift.

**Step 4:** This shift in demand can result in a new equilibrium, where the quantity demanded changes at a given price.

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "type": "fill_in",
    "question": "A change in demand occurs when factors other than the good's [[blank]] change.",
    "answer": "price",
    "explanation": "A change in demand is distinct from a change in quantity demanded, which occurs when the price of the good changes. A change in demand happens when other factors change, causing a shift in the demand curve.",
    "textWithBlanks": "A change in demand occurs when factors other than the good's [[blank]] change."
  },
  {
    "type": "mcq",
    "question": "What happens to the demand curve when there is a change in demand due to a factor other than price?",
    "options": {
      "a": "It becomes steeper",
      "b": "It shifts to the right or left",
      "c": "It becomes flatter",
      "d": "It remains unchanged"
    },
    "answer": "b",
    "explanation": "When there is a change in demand due to a factor other than price, the entire demand curve shifts to the right or left, indicating a change in demand."
  },
  {
    "type": "trace",
    "question": "Trace the causal chain from an increase in consumer income to the effect on the demand curve for a normal good.",
    "steps": [
      "An increase in consumer income occurs",
      "The purchasing power of consumers increases",
      "Consumers demand more of the normal good at each price level",
      "The demand curve for the normal good shifts to the right"
    ],
    "answer": "The demand curve for the normal good shifts to the right",
    "explanation": "An increase in consumer income leads to an increase in the demand for a normal good, causing the demand curve to shift to the right, as consumers demand more of the good at each price level."
  }
]

```