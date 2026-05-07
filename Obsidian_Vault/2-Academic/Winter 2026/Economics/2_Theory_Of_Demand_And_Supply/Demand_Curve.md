---

title: Demand_Curve
type: Atomic Note
course: Economics
semester: Winter 2026
unit: '2'
hub: "[[2_Theory_Of_Demand_And_Supply_Hub]]"
source: "[[5-Pdf Store/note generated/Winter 2026/Economics/Chapter_2.pdf]]"
source_pages:
- 7
mode: ECON-MACRO
read: false
generated: true
prerequisites:
- "[[Demand_Schedule]]"

---

# 1. Mental Model

Imagine you're at a school bake sale. The price of a cookie is 50 cents, and 20 cookies are sold. If the price is raised to $1, only 10 cookies are sold. This shows that as the price increases, the quantity of cookies demanded decreases. The demand curve illustrates this relationship between price and quantity demanded.

# 2. Economic Theory

The [[Demand_Curve]] is a graphical representation of the [[Law_Of_Demand]], which states that as the price of a good increases, the quantity demanded decreases, ceteris paribus [[Ceteris_Paribus]]. This relationship is often depicted as a downward-sloping curve, where the x-axis represents the quantity demanded and the y-axis represents the price. The [[Demand_Function]] can be expressed as $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price. The [[Theory_Of_Demand]] underlying the demand curve assumes that consumers are rational and make optimal choices based on their preferences and budget constraints. The [[Market_Demand_Curve]] is the aggregation of individual demand curves, representing the total quantity demanded in the market at each price level.

# 3. Market Failures

The demand curve model has limitations, particularly when dealing with [[Inferior_Goods]] or [[Giffen_Goods]], where the [[Law_Of_Demand]] does not hold. Additionally, the model assumes [[Ceteris_Paribus]], which may not always be the case in reality, as changes in [[Determinants_Of_Demand]], such as consumer income or preferences, can shift the demand curve. The [[Market_Equilibrium]] may also be affected by external factors, such as [[Surplus_And_Shortage]], which can lead to market instability. Furthermore, the demand curve model may not account for [[Substitute_Goods]] or [[Complementary_Goods]], which can impact the quantity demanded of a particular good.

# 4. Economic Model

```mermaid

graph LR
    A[Price (P)] --> B[Quantity Demanded (Qd)]
    B --> C[Demand Curve (Qd = f(P))]
    C --> D[Law of Demand (P ↑, Qd ↓)]
    D --> E[Ceteris Paribus (All else equal)]

```

This Mermaid flowchart illustrates the relationship between price, quantity demanded, and the demand curve, ultimately grounded in the Law of Demand and the assumption of ceteris paribus.

## 5. Walkthrough

Here's a 5-step technical walkthrough of how the demand curve operates:

1. **Initial State**: The price of a cookie is $0.50, and 20 cookies are sold at the school bake sale.
2. **Price Increase**: The price of a cookie is raised to $1.00. According to the Law of Demand, this increase in price should lead to a decrease in the quantity demanded.
3. **Quantity Demanded Update**: As a result of the price increase, the quantity demanded decreases to 10 cookies.
4. **Demand Curve Shift**: If other factors remain constant (ceteris paribus), the demand curve shifts to reflect the new price-quantity combination. The demand curve is downward-sloping, indicating that as the price increases, the quantity demanded decreases.
5. **Market Equilibrium**: The demand curve intersects with the supply curve at a new equilibrium point, where the quantity supplied equals the quantity demanded at the given price. For example, if the supply curve is given by $Q_s = 10 + 2P$, and the demand curve is $Q_d = 20 - 2P$, the equilibrium price and quantity can be found by setting $Q_s = Q_d$ and solving for $P$ and $Q$. 

For instance, 
$$
\begin{aligned}
10 + 2P &= 20 - 2P \\
4P &= 10 \\
P &= 2.50 \\
Q_d &= 20 - 2(2.50) = 15
\end{aligned}
$$
At a price of $2.50, the quantity demanded and supplied is 15 cookies.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The demand curve for industrial robots has a positive slope, indicating that as the price increases, the quantity demanded also increases.",
    "answer": false,
    "explanation": "The demand curve is a graphical representation of the Law of Demand, which states that as the price of a good increases, the quantity demanded decreases, ceteris paribus. This relationship can be expressed as $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price. The demand curve typically has a negative slope, not a positive one, because as the price increases, the quantity demanded decreases. Therefore, the statement that the demand curve for industrial robots has a positive slope is false."
  },
  {
    "id": "q2",
    "type": "synthesis",
    "difficulty": "L2",
    "question": "An aerospace engineering company is experiencing a critical shortage of specialized avionics chips, essential for the production of navigation systems in aircraft. The current supplier can only provide 1000 chips per month at $50 each. However, if the company is willing to pay $60 per chip, the supplier can increase the supply to 1200 chips per month. The demand for these chips is high, but the company needs to determine the optimal price to pay to ensure a steady supply without overpaying. Using the concept of the demand curve, derive a solution to prevent system failure due to chip shortage.",
    "answer": "To solve this problem, we first need to understand the demand curve and how it applies to this scenario. The demand curve is a graphical representation of the relationship between the price of a good and the quantity demanded. In this case, we have two points on the demand curve: (1000, $50) and (1200, $60). We can use these points to derive the demand function and then determine the optimal price to pay for the chips.\n\nLet's assume a linear demand function: $Q_d = a - bP$, where $Q_d$ is the quantity demanded and $P$ is the price. Using the given points, we can set up two equations:\n\n$1000 = a - 50b$\n$1200 = a - 60b$\n\nSolving these equations simultaneously, we get:\n\n$200 = 10b$\n$b = 20$\n\nSubstituting $b = 20$ into one of the original equations, we get:\n\n$1000 = a - 50(20)$\n$a = 2000$\n\nSo, the demand function is: $Q_d = 2000 - 20P$\n\nTo prevent system failure, the company needs to ensure a steady supply of chips. Let's assume the company needs at least 1100 chips per month. We can set up the equation:\n\n$1100 = 2000 - 20P$\n\nSolving for $P$, we get:\n\n$20P = 900$\n$P = 45$\n\nHowever, this price may not be acceptable to the supplier. Let's check the quantity supplied at $50 and $60:\n\nAt $50: $Q_d = 2000 - 20(50) = 1000$\nAt $60: $Q_d = 2000 - 20(60) = 800$\n\nThe supplier can provide 1000 chips at $50 and 1200 chips at $60. To ensure a steady supply of at least 1100 chips, the company needs to pay at least $55, which can be calculated as:\n\n$1100 = 2000 - 20P$\n$20P = 900$\n$P = 45$\n\nBut we can also calculate it by interpolation between 1000 and 1200 chips:\n\n$P = 50 + (60-50)*(1100-1000)/(1200-1000) = 50 + 10*100/200 = 55$\n\nTherefore, the company needs to pay $55 per chip to ensure a steady supply of at least 1100 chips per month.",
    "explanation": "The demand curve is a graphical representation of the Law of Demand, which states that as the price of a good increases, the quantity demanded decreases, ceteris paribus. The demand function can be expressed as $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price. In this scenario, we used a linear demand function: $Q_d = a - bP$. The parameters $a$ and $b$ were estimated using two points on the demand curve. The company needs to ensure a steady supply of chips, and by using the demand function, we determined that the company needs to pay $55 per chip to ensure a steady supply of at least 1100 chips per month."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L2",
    "question": "Explain the concept of a Demand Curve in the context of Global Supply Chain & Maritime Logistics, and provide a mathematical representation of the demand function.",
    "answer": "The demand curve in Global Supply Chain & Maritime Logistics illustrates the inverse relationship between the price of a product and the quantity demanded by customers. As the price increases, the quantity demanded decreases, and vice versa. This relationship is crucial in determining the optimal price and quantity of goods to be transported and stored. For instance, a higher price for shipping containers may lead to a decrease in demand for container shipping services. \nThe demand function can be represented as $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price. A simple linear demand function can be expressed as $Q_d = a - bP$, where $a$ and $b$ are constants.",
    "explanation": "The demand curve is a graphical representation of the Law of Demand, which states that as the price of a good increases, the quantity demanded decreases, ceteris paribus. The demand function $Q_d = f(P)$ can be derived from the theory of consumer behavior, which assumes that consumers are rational and make optimal choices based on their preferences and budget constraints. The linear demand function $Q_d = a - bP$ can be used to estimate the demand for shipping services, where $a$ represents the intercept or the maximum quantity demanded when price is zero, and $b$ represents the slope of the demand curve, which measures the responsiveness of quantity demanded to changes in price. The demand curve is a downward-sloping curve, where the x-axis represents the quantity demanded and the y-axis represents the price. In the context of Global Supply Chain & Maritime Logistics, the demand curve plays a critical role in determining the optimal price and quantity of goods to be transported and stored."
  },
  {
    "id": "q4",
    "type": "order",
    "difficulty": "L2",
    "question": "Order steps for the Demand Curve technical process.",
    "steps": [
      "The price of a good increases",
      "The quantity demanded decreases",
      "A graphical representation is created",
      "The demand function is expressed",
      "The relationship is depicted as a downward-sloping curve"
    ],
    "answer": [
      "The price of a good increases",
      "The quantity demanded decreases",
      "The demand function is expressed",
      "A graphical representation is created",
      "The relationship is depicted as a downward-sloping curve"
    ]
  },
  {
    "id": "q5",
    "type": "trace",
    "difficulty": "L3",
    "question": "Error generating question.",
    "answer": "N/A"
  }
]

```