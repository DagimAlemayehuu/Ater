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
    "type": "true_false",
    "difficulty": "L1",
    "question": "The demand function in global supply chain and maritime logistics assumes that changes in price have no effect on the quantity demanded of a good.",
    "answer": false,
    "explanation": "The demand function, represented as Qd = f(P), is based on the Law of Demand, which states that as the price of a good increases, the quantity demanded decreases, and vice versa, ceteris paribus. This relationship can be expressed using a simple linear equation: $Qd = a - bP$, where $a$ and $b$ are constants, and $b$ represents the change in quantity demanded in response to a one-unit change in price. Therefore, the statement that changes in price have no effect on the quantity demanded is false."
  },
  {
    "id": "q2",
    "type": "synthesis",
    "difficulty": "L2",
    "question": "A sudden outbreak of a highly contagious disease has occurred in a densely populated urban area, leading to a surge in demand for medical supplies, particularly face masks. The local health authority is struggling to maintain a stable supply chain, and the demand for face masks is expected to increase exponentially. Using the demand function concept, how can the health authority optimize the allocation of face masks to prevent system failure?",
    "answer": "The health authority can use the demand function Qd = f(P) to optimize the allocation of face masks. Assuming a linear demand function Qd = a - bP, where Qd is the quantity demanded, P is the price, and a and b are constants, the authority can estimate the demand for face masks based on their price. By setting a price ceiling, the authority can ensure that face masks are affordable and available to those who need them most. Additionally, the authority can use dynamic pricing strategies to adjust the price of face masks in real-time, based on changes in demand. This can help to prevent shortages and ensure a stable supply chain.",
    "explanation": "The demand function can be represented mathematically as $Qd = a - bP$, where $Qd$ is the quantity demanded, $P$ is the price, and $a$ and $b$ are constants. The law of demand states that as the price of a good increases, the quantity demanded decreases, and vice versa. This can be represented graphically as a downward-sloping demand curve. By setting a price ceiling, the health authority can ensure that face masks are affordable and available to those who need them most. The price ceiling can be represented mathematically as $P \\leq P_{max}$, where $P_{max}$ is the maximum price. Using dynamic pricing strategies, the authority can adjust the price of face masks in real-time, based on changes in demand. This can be represented mathematically as $P = P(Qd)$, where $P$ is the price and $Qd$ is the quantity demanded. By optimizing the allocation of face masks using the demand function, the health authority can prevent system failure and ensure a stable supply chain."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L2",
    "question": "Explain the concept of a Demand Function in the context of Global Supply Chain & Maritime Logistics, and provide a mathematical representation of the relationship between the price of a good and the quantity demanded.",
    "answer": "The demand function in global supply chain and maritime logistics is a mathematical representation of the relationship between the price of a good and the quantity demanded. It is often expressed as Qd = f(P), where Qd is the quantity demanded and P is the price. In the context of maritime logistics, the demand function can be used to analyze the impact of changes in shipping prices on the quantity of goods demanded by consumers. For instance, if shipping companies increase their prices due to rising fuel costs, the quantity demanded by consumers may decrease, ceteris paribus. The demand function helps logistics companies to understand this relationship and make informed decisions about pricing and supply chain management.",
    "explanation": "The underlying mechanism of the demand function can be explained using the law of demand, which states that as the price of a good increases, the quantity demanded decreases, and vice versa. This can be represented mathematically as $Qd = f(P) = a - bP$, where $a$ and $b$ are constants, and $b$ represents the change in quantity demanded in response to a change in price. The demand function can be graphed as a downward-sloping curve, illustrating the inverse relationship between price and quantity demanded. In the context of global supply chain and maritime logistics, the demand function can be used to analyze the impact of changes in shipping prices on the quantity of goods demanded by consumers, and to make informed decisions about pricing and supply chain management."
  },
  {
    "id": "q4",
    "type": "order",
    "difficulty": "L2",
    "question": "Order steps for Demand Function.",
    "steps": [
      "Determine the Quantity Demanded (Qd)",
      "Specify the Price (P)",
      "Apply the Law of Demand",
      "Assume Ceteris Paribus"
    ],
    "answer": [
      "Assume Ceteris Paribus",
      "Specify the Price (P)",
      "Apply the Law of Demand",
      "Determine the Quantity Demanded (Qd)"
    ]
  },
  {
    "id": "q5",
    "type": "trace",
    "difficulty": "L3",
    "question": "What is the exact output of the demand function in Aerospace Engineering & Avionics, given a specific price point and assuming all other factors remain constant?",
    "content": "The demand function in Aerospace Engineering & Avionics can be represented as Qd = f(P), where Qd is the quantity demanded and P is the price. For instance, let's assume the demand function for commercial airliners is Qd = 1000 - 2P, where Qd is the number of airliners demanded and P is the price per airliner.",
    "answer": "Qd = 1000 - 2P",
    "explanation": "The underlying mechanism of the demand function is based on the Law of Demand, which states that as the price of a good increases, the quantity demanded decreases, and vice versa, assuming ceteris paribus. This can be represented mathematically as $\\frac{\\partial Qd}{\\partial P} < 0$. For the given demand function Qd = 1000 - 2P, the derivative is $\\frac{\\partial Qd}{\\partial P} = -2$, indicating that for every unit increase in price, the quantity demanded decreases by 2 units."
  }
]

```