---

title: Law_Of_Demand
type: Atomic Note
course: Economics
semester: Winter 2026
unit: '2'
hub: "[[2_Theory_Of_Demand_And_Supply_Hub]]"
source: "[[5-Pdf Store/note generated/Winter 2026/Economics/Chapter_2.pdf]]"
source_pages:
- 4
mode: ECON-MACRO
read: false
generated: true
prerequisites:
- "[[Theory_Of_Demand]]"

---

# 1. Mental Model

Imagine you're at a lemonade stand, and the owner, Emma, is selling lemonade for 50 cents a cup. You really like lemonade, so you buy 2 cups. But then, Emma raises the price to $1 a cup. You start to think that $1 is too expensive, so you only buy 1 cup. If Emma lowers the price back to 50 cents, you'll probably buy 2 cups again. This shows that when the price of lemonade goes up, you buy less, and when the price goes down, you buy more. This is like a seesaw: when the price goes up, the amount you buy goes down, and vice versa.

# 2. Economic Theory

The [[Law_Of_Demand]] states that there is an inverse relationship between the price of a commodity and its quantity demanded, [[Ceteris_Paribus]] (all other factors being equal). This relationship is rooted in the [[Theory_Of_Demand]], which assumes that consumers will buy more of a good at a lower price and less at a higher price. The [[Demand_Schedule]] and [[Demand_Curve]] illustrate this relationship, showing that as the price of a good increases, the quantity demanded decreases, and vice versa. The [[Demand_Function]] represents this relationship mathematically: $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price. For [[Normal_Goods]], the [[Income_Elasticity_Of_Demand]] is positive, meaning that as income increases, demand also increases. The [[Price_Elasticity_Of_Demand]] measures the responsiveness of the quantity demanded to changes in price.

# 3. Market Failures

The [[Law_Of_Demand]] has limitations, particularly in cases where [[Ceteris_Paribus]] does not hold. For example, during [[Surplus_And_Shortage]], the [[Law_Of_Demand]] may not apply as expected. Additionally, the [[Paradox_Of_Thrift]] and [[Effects_Of_Shift_In_Demand_And_Supply]] can lead to exceptions to the [[Law_Of_Demand]]. In situations where goods are [[Inferior_Goods]], an increase in income may lead to a decrease in demand, contradicting the [[Law_Of_Demand]]. Furthermore, the presence of [[Substitute_Goods]] and [[Complementary_Goods]] can affect the [[Demand_Curve]] and lead to deviations from the [[Law_Of_Demand]]. Understanding these exceptions is crucial for applying the [[Law_Of_Demand]] in real-world scenarios.

# 4. Economic Model

```mermaid

graph LR
    A[Price (P)] -->|Increases| B[Quantity Demanded (Qd)]
    A -->|Decreases| C[Quantity Demanded (Qd) Increases]
    B[Quantity Demanded (Qd) Decreases] -->|Inverse Relationship| C
    C[Quantity Demanded (Qd) Increases] -->|Follows Law Of Demand| D[Demand Curve Downward Sloping]
    D --> E[Ceteris Paribus Assumption]

```

This Mermaid flowchart illustrates the inverse relationship between price and quantity demanded, showing that as price increases, quantity demanded decreases, and vice versa. The chart also highlights the ceteris paribus assumption, which is crucial for the Law of Demand to hold.

## 5. Walkthrough

Here's a 5-step technical walkthrough of how the **Law of Demand** operates in the **Smartphone Market**:

1. **Initial Market State**: A flagship smartphone is priced at $800. At this price, the manufacturer sells 1 million units per month globally.

2. **Price Variable Change**: Due to a strategic holiday discount, the price is lowered to $600 (a 25% decrease).

3. **Consumer Response**: As the price falls, the good becomes relatively cheaper compared to other gadgets. Consumers who were previously on the fence now enter the market.

4. **Quantity Observation**: The quantity demanded surges to 1.5 million units per month. This movement **along** the demand curve demonstrates the inverse relationship.

5. **Inverse Verification**: If the manufacturer later raises the price to $1,000, the quantity demanded is observed to drop to 700,000 units. Under the **Ceteris Paribus** assumption, the inverse correlation between price and quantity is confirmed.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "The Law of Demand states that, Ceteris Paribus, price and quantity demanded have a/an:",
    "options": {
      "A": "Direct relationship.",
      "B": "Inverse relationship.",
      "C": "Neutral relationship.",
      "D": "Exponential relationship."
    },
    "answer": "B",
    "explanation": "Inverse relationship means as one variable (price) increases, the other variable (quantity demanded) decreases, and vice versa."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "The Law of Demand holds true only if we assume that factors like income and tastes remain constant (Ceteris Paribus).",
    "answer": true,
    "explanation": "If other factors change (e.g., income rises), consumers might buy more even at a higher price, which would look like an exception but is actually a shift in the entire curve, not a movement along it."
  },
  {
    "id": "q3",
    "type": "synthesis",
    "difficulty": "L3",
    "question": "Explain the 'Substitution Effect' and 'Income Effect' as they relate to the Law of Demand when the price of a good falls.",
    "answer": "When price falls: 1) Substitution Effect: The good becomes relatively cheaper than its substitutes, so consumers switch to it. 2) Income Effect: The fall in price increases consumers' 'real income' (purchasing power), allowing them to buy more of all normal goods, including the one in question. Both effects typically increase quantity demanded.",
    "explanation": "Synthesis requires breaking down the Law of Demand into its underlying micro-economic drivers."
  },
  {
    "id": "q4",
    "type": "trace",
    "difficulty": "L2",
    "question": "Trace the movement on a graph if a coffee shop increases the price of a latte from $4 to $6.",
    "answer": "1) Identify the original point ($4, Q1) on the demand curve. 2) Move upward along the existing demand curve to the new price point of $6. 3) Identify the new, lower quantity (Q2). 4) Note that the curve itself has not moved.",
    "explanation": "Tracing the graphical representation of the Law of Demand as a movement along the curve."
  },
  {
    "id": "q5",
    "type": "order",
    "difficulty": "L2",
    "question": "Order the sequence of events following an **Increase** in the market price of a good.",
    "steps": [
      "Movement occurs upward along the existing demand curve",
      "Consumers reduce their quantity demanded to maintain budget utility",
      "The price of the good rises due to a supply shock",
      "A new equilibrium point is reached at a lower quantity",
      "Substitution effect leads consumers to look for alternatives"
    ],
    "answer": [
      "The price of the good rises due to a supply shock",
      "Substitution effect leads consumers to look for alternatives",
      "Consumers reduce their quantity demanded to maintain budget utility",
      "Movement occurs upward along the existing demand curve",
      "A new equilibrium point is reached at a lower quantity"
    ],
    "explanation": "The price change is the trigger, followed by consumer behavioral shifts (substitution/utility), resulting in the graphical movement and final equilibrium state."
  }
]
```