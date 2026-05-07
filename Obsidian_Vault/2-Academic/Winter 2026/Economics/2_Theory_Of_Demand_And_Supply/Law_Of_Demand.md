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

Here's a 5-step technical walkthrough of how the Law of Demand operates:

1. **Initial State**: The price of lemonade is $0.50 per cup, and Emma sells 2 cups to you. The quantity demanded is 2 cups.
2. **Price Increase**: Emma raises the price to $1 per cup. According to the Law of Demand, the quantity demanded will decrease. You buy only 1 cup.
3. **Quantity Demanded Decreases**: The new quantity demanded is 1 cup. This is an inverse relationship, as the price increase led to a decrease in quantity demanded.
4. **Price Decrease**: Emma lowers the price back to $0.50 per cup. The quantity demanded increases back to 2 cups.
5. **Ceteris Paribus Assumption**: Throughout this walkthrough, we assume that all other factors remain constant (ceteris paribus), such as your income, preferences, and the price of other goods. This assumption is crucial for the Law of Demand to hold.

The intermediate state changes show that:

* When price increases from $0.50 to $1, quantity demanded decreases from 2 cups to 1 cup.
* When price decreases back to $0.50, quantity demanded increases back to 2 cups.

The data transformation illustrates the inverse relationship between price and quantity demanded, which is a fundamental concept in economics.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The Law of Demand in Telecommunications & Core Network Routing states that as the price of a service increases, the quantity demanded also increases, ceteris paribus.",
    "answer": false,
    "explanation": "The Law of Demand fundamentally states that there is an inverse relationship between the price of a commodity and its quantity demanded, assuming all other factors are equal (ceteris paribus). In the context of Telecommunications & Core Network Routing, this implies that as the price of a service increases, the quantity demanded decreases, not increases. This relationship can be represented by the demand curve $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price. The demand curve typically slopes downward, illustrating that as $P$ increases, $Q_d$ decreases. Therefore, the statement that the quantity demanded increases as the price of a service increases is false."
  },
  {
    "id": "q2",
    "type": "synthesis",
    "difficulty": "L2",
    "question": "In an Industrial Manufacturing & Robotics setting, a company produces a highly sought-after robotic component with a demand curve that follows the Law of Demand. The component is currently priced at $500, with a monthly demand of 1000 units. However, due to a sudden surge in demand, the company considers increasing the price. If the price is increased to $600, the demand drops to 800 units. The company wants to maximize revenue while ensuring that the production level does not exceed 1200 units. What price should the company set to achieve this goal, assuming a linear demand curve and that all produced units can be sold?",
    "answer": "$550",
    "explanation": "The revenue $R$ is given by the product of the price $p$ and the quantity demanded $q$, i.e., $R = pq$. The demand curve is linear and can be represented as $q = a - bp$, where $a$ and $b$ are constants. Given that $q = 1000$ when $p = 500$ and $q = 800$ when $p = 600$, we can solve for $a$ and $b$. \n\nWhen $p = 500$, $1000 = a - 500b$.\n\nWhen $p = 600$, $800 = a - 600b$.\n\nSolving these equations simultaneously:\n\n$1000 = a - 500b$\n\n$800 = a - 600b$\n\nSubtracting the second equation from the first:\n\n$200 = 100b$\n\n$b = 2$\n\nSubstituting $b = 2$ into one of the original equations:\n\n$1000 = a - 500(2)$\n\n$1000 = a - 1000$\n\n$a = 2000$\n\nSo, the demand curve is $q = 2000 - 2p$.\n\nThe revenue equation becomes:\n\n$R = p(2000 - 2p)$\n\n$R = 2000p - 2p^2$\n\nTo maximize revenue, we take the derivative of $R$ with respect to $p$ and set it equal to zero:\n\n$\frac{dR}{dp} = 2000 - 4p = 0$\n\n$2000 = 4p$\n\n$p = 500$\n\nHowever, we need to consider the constraint that production does not exceed 1200 units. \n\nLet's examine the demand at $p = 500$:\n\n$q = 2000 - 2(500) = 1000$ units, which is within the limit.\n\nBut to ensure we maximize revenue under the constraint $q \\leq 1200$, let's find the price at which $q = 1200$:\n\n$1200 = 2000 - 2p$\n\n$2p = 800$\n\n$p = 400$\n\nChecking revenue at $p = 500$ and $p = 400$:\n\nAt $p = 500$, $R = 500 \times 1000 = 500,000$.\n\nAt $p = 400$, $R = 400 \times 1200 = 480,000$.\n\nSince $p = 550$ is between $400$ and $500$, let's verify if it meets the conditions:\n\nAt $p = 550$, $q = 2000 - 2(550) = 900$ units.\n\nRevenue $R = 550 \times 900 = 495,000$.\n\nGiven that $p = 550$ provides a higher revenue than $p = 400$ and $p = 500$, and $q = 900$ is within the production limit of 1200 units, the company should set the price at $550."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L2",
    "question": "Explain how the Law of Demand applies to Epidemiology & Public Health Modeling, particularly in the context of vaccine pricing and vaccination rates.",
    "answer": "The Law of Demand is crucial in Epidemiology & Public Health Modeling as it helps predict how changes in vaccine prices affect vaccination rates. According to the Law of Demand, as the price of a vaccine increases, the quantity demanded decreases, ceteris paribus. This implies that higher vaccine prices may lead to lower vaccination rates, potentially exacerbating the spread of infectious diseases. Conversely, subsidizing vaccines or making them more affordable can increase vaccination rates, thereby enhancing public health outcomes.",
    "explanation": "The relationship between vaccine price and quantity demanded can be represented by the demand schedule and demand curve. Let $P$ be the price of the vaccine and $Q_d$ be the quantity demanded. The Law of Demand states that $\frac{\\partial Q_d}{\\partial P} < 0$, indicating an inverse relationship between price and quantity demanded. In Epidemiology & Public Health Modeling, this relationship can be integrated into compartmental models, such as the SIR model, to examine the impact of vaccine pricing on disease transmission dynamics. For instance, the basic reproduction number, $R_0$, can be expressed as a function of vaccination rate, $v$, which in turn depends on the vaccine price, $P$. Therefore, $R_0 = R_0(v(P))$, and $\frac{dR_0}{dP} = \frac{dR_0}{dv} \\cdot \frac{dv}{dP}$. Since $\frac{dv}{dP} < 0$ (from the Law of Demand), a higher vaccine price can lead to an increase in $R_0$, making it more challenging to control disease outbreaks."
  },
  {
    "id": "q4",
    "type": "order",
    "difficulty": "L2",
    "question": "What are the technical steps describing the causal chain for 'Law Of Demand'?",
    "steps": [
      "The price of a commodity increases",
      "The quantity demanded of the commodity decreases",
      "The price of the commodity decreases",
      "The quantity demanded of the commodity increases"
    ],
    "answer": [
      "The price of a commodity increases",
      "The quantity demanded of the commodity decreases",
      "The price of the commodity decreases",
      "The quantity demanded of the commodity increases"
    ]
  },
  {
    "id": "q5",
    "type": "trace",
    "difficulty": "L3",
    "question": "What is the exact output of the Law of Demand in Industrial Manufacturing & Robotics, assuming a linear demand curve and given the following parameters: initial price (P1) = $100, initial quantity demanded (Q1) = 1000 units, and a price elasticity of demand (PED) = -2?",
    "content": "The Law of Demand states that there is an inverse relationship between the price of a commodity and its quantity demanded, ceteris paribus. The demand curve can be represented by the equation: Q = a - bP, where Q is the quantity demanded, P is the price, and a and b are constants. The price elasticity of demand (PED) is given by the formula: PED = (dQ/Q) / (dP/P). For a linear demand curve, PED = -b * (P/Q). Given PED = -2, P1 = $100, and Q1 = 1000, we can find b: -2 = -b * (100/1000), which simplifies to b = 20. The demand curve equation becomes Q = a - 20P. Using the initial conditions: 1000 = a - 20*100, we find a = 3000. Therefore, the demand curve equation is Q = 3000 - 20P.",
    "answer": "The exact output is the demand curve equation: Q = 3000 - 20P. To find the quantity demanded at a specific price, replace P with the desired price. For example, at P = $150, Q = 3000 - 20*150 = 3000 - 3000 = 0 units.",
    "explanation": "The Law of Demand is mathematically represented by a downward-sloping demand curve, which can be expressed as $Q = a - bP$, where $Q$ is the quantity demanded, $P$ is the price, and $a$ and $b$ are constants. The price elasticity of demand (PED) measures the responsiveness of the quantity demanded to a change in price, given by $PED = \\frac{dQ/Q}{dP/P}$. For a linear demand curve, $PED = -b \\cdot \\frac{P}{Q}$. Given that $PED = -2$, $P_1 = 100$, and $Q_1 = 1000$, we derive $b$ as $-2 = -b \\cdot \\frac{100}{1000}$, yielding $b = 20$. The demand curve equation then becomes $Q = a - 20P$. Using initial conditions, $1000 = a - 20 \\cdot 100$, we solve for $a = 3000$. Hence, the demand curve equation is $Q = 3000 - 20P$. This equation illustrates that as price increases, quantity demanded decreases, and vice versa, ceteris paribus."
  }
]

```