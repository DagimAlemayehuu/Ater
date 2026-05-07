---

title: Demand_Function
type: Atomic Note
course: Economics
semester: Winter 2026
unit: '2'
hub: "[[2_Theory_Of_Demand_And_Supply_Hub]]"
source: "[[5-Pdf Store/note generated/Winter 2026/Economics/Chapter_2.pdf]]"
source_pages:
- 8
mode: ECON-MACRO
read: false
generated: true
prerequisites:
- "[[Demand_Curve]]"

---

# 1. Mental Model

Imagine you're at a big music festival, and your favorite artist is performing. The number of tickets you want to buy depends on the price. If the tickets are cheap, you might buy more, but if they're expensive, you might buy fewer. This is similar to a demand function, which shows how the price of something affects how much of it people want to buy. The price of tickets and the number of tickets you want to buy are like two connected gears - when one changes, the other changes too.

# 2. Economic Theory

The [[Demand_Function]] is a mathematical representation of the relationship between the price of a good and the quantity demanded, assuming [[Ceteris_Paribus]], or all other things remain constant. It is often expressed as Qd = f(P), where Qd is the quantity demanded and P is the price. The underlying mechanism of the [[Demand_Function]] is based on the [[Law_Of_Demand]], which states that as the price of a good increases, the quantity demanded decreases, and vice versa. This relationship is typically illustrated by a [[Demand_Curve]], which plots the quantity demanded against the price. The [[Demand_Schedule]] provides a tabular representation of this relationship. The [[Theory_Of_Demand]] explains that the [[Demand_Function]] is influenced by various [[Determinants_Of_Demand]], such as changes in consumer preferences, income, and prices of [[Substitute_Goods]] and [[Complementary_Goods]].

# 3. Market Failures

The [[Demand_Function]] has limitations, particularly in situations where [[Ceteris_Paribus]] does not hold. For instance, during times of high inflation, the relationship between price and quantity demanded may be distorted. Additionally, the [[Demand_Function]] assumes that consumers have perfect information about the market, which is not always the case. The concept of [[Market_Equilibrium]] relies on the [[Demand_Function]], but it may not account for external factors that affect demand, such as changes in technology or [[Shift_In_Supply_Curve]]. Furthermore, the [[Demand_Function]] may not capture the [[Effects_Of_Shift_In_Demand_And_Supply]] on market outcomes, leading to potential market failures.

# 4. Economic Model

```mermaid

graph LR
    A[Price (P)] --> B[Quantity Demanded (Qd)]
    B --> C[Demand Curve]
    C --> D[Demand Schedule]
    D --> E[Market Equilibrium]
    E --> F[Changes in Demand (e.g., income, preferences)]

```

This Mermaid flowchart illustrates the relationships between the price of a good, the quantity demanded, the demand curve, the demand schedule, and market equilibrium. The demand curve and schedule show how the quantity demanded changes in response to price changes, while market equilibrium is determined by the intersection of the demand and supply curves.

## 5. Walkthrough

Here's a 5-step technical walkthrough of how the Demand Function operates:

1. **Initial State**: Suppose the price of a concert ticket is $50, and 1000 tickets are demanded. The demand function can be represented as Qd = f(P) = 1000 - 10P.
2. **Price Change**: If the price of the ticket increases to $60, the quantity demanded decreases to 900 tickets. This is calculated by substituting P = 60 into the demand function: Qd = 1000 - 10(60) = 900.
3. **Demand Curve Update**: The new price-quantity pair ($60, 900) is plotted on the demand curve, which shows the relationship between the price and quantity demanded.
4. **Market Equilibrium**: Suppose the supply of tickets is 900 at a price of $60. The market equilibrium is determined by the intersection of the demand and supply curves, resulting in a market price of $60 and a quantity of 900 tickets.
5. **Changes in Demand**: If consumer income increases, the demand for tickets may increase, causing the demand curve to shift to the right. For example, if the demand function becomes Qd = f(P) = 1200 - 10P, the quantity demanded at a price of $60 would increase to 1200 - 10(60) = 1200 tickets.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "In the demand function $Q_d = a - bP$, the coefficient 'b' represents:",
    "options": {
      "A": "The quantity demanded when price is zero.",
      "B": "The price level where demand becomes perfectly elastic.",
      "C": "The responsiveness (slope) of quantity demanded to price changes.",
      "D": "The percentage of income spent on the good."
    },
    "answer": "C",
    "explanation": "In a linear demand function, 'b' represents the slope ($dQ/dP$), showing how many units of quantity are lost for every one-unit increase in price."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "A Demand Function like $Q_d = f(P, Y, P_s)$ is only valid if we assume $Y$ (Income) and $P_s$ (Price of substitutes) are constants.",
    "answer": true,
    "explanation": "To plot a 2D Demand Curve, we must hold all variables other than price constant (Ceteris Paribus). If $Y$ or $P_s$ change, the entire function shifts."
  },
  {
    "id": "q3",
    "type": "synthesis",
    "difficulty": "L3",
    "question": "Suppose a market has a demand function $Q_d = 500 - 5P$. If the government imposes a price floor at $P=80$, calculate the quantity demanded and analyze the resulting market state.",
    "answer": "$Q_d = 500 - 5(80) = 500 - 400 = 100$. If the equilibrium price was lower than $80$, this price floor would create a surplus, as quantity supplied would likely exceed 100 while quantity demanded is restricted to 100.",
    "explanation": "Synthesis requires using the mathematical function to predict the outcome of a policy intervention (Price Floor)."
  },
  {
    "id": "q4",
    "type": "trace",
    "difficulty": "L2",
    "question": "Trace the change in $Q_d$ using the function $Q_d = 200 - 2P$ if the price rises from $20 to $30.",
    "answer": "1) Initial $Q_d = 200 - 2(20) = 160$. 2) New $Q_d = 200 - 2(30) = 140$. 3) Resulting change is a decrease of 20 units.",
    "explanation": "Tracing requires sequential calculation of the dependent variable ($Q_d$) based on the independent variable ($P$)."
  },
  {
    "id": "q5",
    "type": "order",
    "difficulty": "L2",
    "question": "Order the steps for estimating a demand function using market data.",
    "steps": [
      "Collect historical price and quantity data",
      "Run a regression analysis to find the best-fit line",
      "Identify the intercept 'a' and slope 'b'",
      "Hold other determinants (income, etc.) constant for the period",
      "Formulate the final equation $Q_d = a - bP$"
    ],
    "answer": [
      "Collect historical price and quantity data",
      "Hold other determinants (income, etc.) constant for the period",
      "Run a regression analysis to find the best-fit line",
      "Identify the intercept 'a' and slope 'b'",
      "Formulate the final equation $Q_d = a - bP$"
    ],
    "explanation": "The process moves from data collection and control to mathematical estimation and final formulation."
  }
]
```