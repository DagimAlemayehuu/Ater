---

title: Law_Of_Demand
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
- '[[Demand_Schedule]]'
- '[[Market_Demand]]'
- '[[Elasticity_And_Total_Revenue]]'
source_pages:
- 4
generated: true

---


## 1. Mental Model

The local coffee shop raises its prices by 10% one morning. As a result, some customers start buying their coffee from a different shop down the street. This change in behavior illustrates how the quantity demanded of the coffee shop's coffee changes in response to a price increase. The coffee shop's owner notices a decrease in the number of cups sold.

## 2. Causal Mechanism

The Law of Demand describes the relationship between the quantity demanded of a good and its price. Given the demand function $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price of the commodity, the law states that, ceteris paribus, an increase in price leads to a decrease in quantity demanded, and vice versa. For example, consider a linear demand function: $Q = a + bp$, where $b = \frac{\Delta Q}{\Delta P}$. Using the example from the source, $b = \frac{7-5}{4-5} = -2$. This negative slope indicates that as price increases, quantity demanded decreases. The demand curve [[Demand_Curve]] represents this relationship graphically, typically having a negative slope. Understanding the Law of Demand is crucial for analyzing [[Market_Equilibrium]] and the effects of changes in market conditions on consumer behavior and market outcomes, including discussions on [[Demand_Schedule]] and [[Market_Demand]].

### Key Takeaways:

- The slope of the demand curve, $b$, is $-2$, indicating that for every unit increase in price, the quantity demanded decreases by 2 units.
- A change in price leads to a movement along the demand curve, not a shift of the curve itself, assuming other factors remain constant.
- The Law of Demand matters for understanding how markets reach equilibrium and for businesses in pricing strategies to maximize revenue, considering factors like [[Elasticity_And_Total_Revenue]].

## 3. Limitations & Edge Cases

The Law of Demand assumes that other factors, such as consumer income, tastes, and prices of related goods [[Substitute_Goods]], remain constant. In reality, these factors can change, causing shifts in the demand curve. For instance, an increase in consumer income can increase demand for [[Normal_Goods]] but decrease demand for [[Inferior_Goods]]. Additionally, the Law of Demand may not hold for goods with [[Technological_Advancement]] that significantly changes consumer preferences or needs. The concept also assumes that consumers have [[Time_And_Eligibility]] to adjust their consumption patterns. Real-world complications, such as Arc Elasticity Of Demand and varying Determinants Of Elasticity Of Supply, can affect the application of the Law of Demand in specific markets.

## 4. Demand Curve Analysis

$Q_d = a + bp$

```mermaid

graph LR

    | A[Price Increase] -->|Leads to| B[Decrease in Quantity Demanded] 
    | B -->|Illustrates| C[Law of Demand] 
    | C -->|Graphically Represented by| D[Demand Curve with Negative Slope]

```

## 5. Walkthrough

**Step 1:** The Law of Demand states that, ceteris paribus, an increase in price leads to a decrease in quantity demanded.

**Step 2:** This relationship is often represented by a linear demand function: $Q_d = a + bp$, where $b = \frac{\Delta Q}{\Delta P}$.

**Step 3:** For instance, given two points on the demand curve (5, 7) and (4, 5), we can calculate $b = \frac{7-5}{4-5} = -2$.

**Step 4:** The negative slope of the demand curve indicates that as price increases, quantity demanded decreases.

**Step 5:** A change in price leads to a movement along the demand curve, not a shift of the curve itself, assuming other factors remain constant.

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "type": "fill_in",
    "question": "The graphical representation of the Law of Demand is a curve with a [[blank]] slope.",
    "answer": "negative",
    "explanation": "The demand curve typically has a negative slope, indicating that as price increases, quantity demanded decreases.",
    "textWithBlanks": "The graphical representation of the Law of Demand is a curve with a [[blank]] slope."
  },
  {
    "type": "mcq",
    "question": "What happens to the quantity demanded of a good when its price increases, according to the Law of Demand?",
    "options": {
      "a": "It increases",
      "b": "It decreases",
      "c": "It remains constant",
      "d": "It becomes elastic"
    },
    "answer": "b",
    "explanation": "The Law of Demand states that, ceteris paribus, an increase in price leads to a decrease in quantity demanded."
  },
  {
    "type": "trace",
    "question": "Trace the causal chain from an increase in the price of a good to the effect on quantity demanded.",
    "steps": [
      "An increase in the price of a good occurs",
      "This makes the good more expensive relative to other goods",
      "Consumers seek cheaper alternatives",
      "Quantity demanded of the good decreases"
    ],
    "answer": "A decrease in quantity demanded",
    "explanation": "The causal chain illustrates how an increase in price leads to a decrease in quantity demanded, as consumers respond to the higher price by seeking cheaper alternatives."
  }
]

```