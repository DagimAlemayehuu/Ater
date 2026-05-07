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

Imagine you're at a popular amusement park, and you're craving a specific type of funnel cake. The number of funnel cakes you want to buy depends on their price. If they're very cheap, you might buy more to share with friends or try different flavors, but if they're expensive, you might buy just one or skip it altogether. In this scenario, the price of the funnel cake acts like a "gatekeeper" to how many you purchase. The cheaper the funnel cake, the more you buy, and the more expensive, the less you buy.

# 2. Economic Theory

The [[Law_Of_Demand]] states that, [[Ceteris_Paribus]] (all else being equal), as the price of a product increases, the quantity demanded of that product decreases, and vice versa. This fundamental principle in economics is rooted in the [[Theory_Of_Demand]], which explains how consumers make decisions about how much of a product to buy based on its price. The [[Demand_Schedule]] and [[Demand_Curve]] are graphical representations of the [[Law_Of_Demand]], illustrating the inverse relationship between the price of a product and the quantity demanded. The [[Demand_Function]] mathematically expresses this relationship as Qd = f(P), where Qd is the quantity demanded and P is the price. The [[Market_Demand]] and [[Market_Demand_Curve]] extend this concept to the entire market, showing how the total quantity demanded of a product changes with its price.

# 3. Limitations & Edge Cases

The [[Law_Of_Demand]] assumes that [[Ceteris_Paribus]] holds, but in reality, many factors can influence demand, leading to exceptions. For instance, the [[Theory_Of_Demand]] does not account for [[Substitutes_And_Complements]], which can cause demand to behave differently than predicted. Additionally, for [[Inferior_Goods]], an increase in income can lead to a decrease in demand, contradicting the [[Law_Of_Demand]]. The concept also does not capture the impact of [[Consumer_Expectations]] on demand; if consumers expect prices to rise in the future, they may buy more now, even if the current price is high. Furthermore, the [[Law_Of_Demand]] may not hold during extraordinary economic conditions, such as [[Surplus_And_Shortage]] situations, where traditional demand-side responses are altered.

# 4. Economic Model

```mermaid

graph LR
    A[Price (P)] -->|Increases| B[Quantity Demanded (Qd) Decreases]
    A -->|Decreases| C[Quantity Demanded (Qd) Increases]
    B --> D[Demand Curve Shifts Left]
    C --> E[Demand Curve Shifts Right]
    D --> F[Ceteris Paribus Assumption]
    E --> F
    F --> G[Market Equilibrium Achieved]

```

This Mermaid flowchart illustrates the Law of Demand, showing how changes in price affect the quantity demanded and the resulting shifts in the demand curve, assuming ceteris paribus.

## 5. Walkthrough

Here's a 5-step technical walkthrough of how the Law of Demand operates in Market Strategy:

1. **Initial State**: The price of a product (e.g., funnel cake) is set at $5, and the quantity demanded is 100 units.
2. **Price Increase**: The price of the funnel cake increases to $7. According to the Law of Demand, this price increase leads to a decrease in the quantity demanded.
3. **Quantity Demanded Decreases**: The quantity demanded decreases to 80 units as consumers are less willing to buy the funnel cake at the higher price.
4. **Demand Curve Shift**: The demand curve shifts left, indicating that consumers are demanding fewer units of the funnel cake at each price level.
5. **Market Equilibrium**: The market reaches a new equilibrium, where the quantity supplied equals the quantity demanded (80 units) at the new price of $7.

Assuming a linear demand function Qd = 120 - 4P, we can calculate the quantity demanded at each price level:

- At P = $5, Qd = 120 - 4(5) = 100
- At P = $7, Qd = 120 - 4(7) = 80

This walkthrough demonstrates how the Law of Demand operates in Market Strategy, illustrating the inverse relationship between price and quantity demanded.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The Law of Demand states that, as the price of a product increases, the quantity demanded of that product also increases, ceteris paribus.",
    "answer": false,
    "explanation": "The Law of Demand is based on the concept that, ceteris paribus (all else being equal), as the price (P) of a product increases, the quantity demanded (Qd) of that product decreases. This relationship is often represented by the demand equation: $Qd = f(P)$, where $f(P)$ is a function that shows the inverse relationship between $P$ and $Qd$. Therefore, the statement that the quantity demanded increases as the price increases, ceteris paribus, directly contradicts the fundamental principle of the Law of Demand. The correct relationship is that as price increases, quantity demanded decreases, which can be expressed as: $\frac{\\partial Qd}{\\partial P} < 0$."
  },
  {
    "id": "q2",
    "type": "synthesis",
    "difficulty": "L2",
    "question": "In a small, developing economy, a sudden and significant devaluation of the local currency occurs, causing the price of imported goods to skyrocket. The government must act quickly to prevent a system failure in the food market. The price of rice, a staple food, increases by 50% overnight, threatening the livelihoods of low-income households. Apply the Law of Demand to design a 3-step policy response to mitigate the crisis.",
    "answer": "To address the crisis, the government should implement the following 3-step policy response:\n\n1. **Price Subsidy**: Immediately introduce a price subsidy on rice to offset the increased cost due to the currency devaluation. This will involve providing financial support to rice importers or directly to consumers to keep the price of rice affordable. The subsidy amount can be calculated as the difference between the new price after devaluation and the original price, ensuring that the cost to consumers remains stable.\n\n2. **Increase Supply**: Implement policies to increase the domestic supply of rice or other staple foods. This can be achieved by providing incentives to local farmers, such as offering lower-interest loans, seeds, and fertilizers, to boost production. Additionally, the government can consider importing rice from other countries at a lower price or through concessional loans to increase the supply in the market.\n\n3. **Targeted Cash Transfer**: Implement a targeted cash transfer program to low-income households to ensure they can afford the staple foods at the new price. This program involves providing direct financial assistance to affected households, enabling them to purchase the necessary food items without compromising their livelihoods. The amount of the transfer can be calculated based on the increased cost of the staple food basket and the household's income level.",
    "explanation": "The sudden devaluation of the currency leads to an increase in the price of imported goods, including rice, due to the higher cost of importing. According to the Law of Demand, as the price of rice increases, the quantity demanded decreases, ceteris paribus. This can be represented as:\n\n$$Q_d = f(P, I, P_s, T, N)$$\n\nWhere:\n- $Q_d$ is the quantity demanded,\n- $P$ is the price of the good (rice in this case),\n- $I$ is the consumer's income,\n- $P_s$ is the price of substitutes,\n- $T$ is the consumer's taste and preferences, and\n- $N$ is the number of consumers.\n\nGiven that the price of rice ($P$) increases, and assuming all else remains equal, the quantity demanded ($Q_d$) will decrease. To mitigate this effect, the government can use the 3-step policy response:\n\n1. **Price Subsidy**: By subsidizing the price of rice, the government effectively reduces the price ($P$) that consumers pay, which can help maintain or increase the quantity demanded ($Q_d$).\n2. **Increase Supply**: Increasing the supply of rice can be represented as a shift in the supply curve to the right, which would lead to a decrease in the market price of rice, thus making it more affordable and increasing the quantity demanded.\n3. **Targeted Cash Transfer**: By providing cash transfers to low-income households, the government effectively increases their income ($I$), allowing them to afford the same quantity of rice at the new, higher price, or even increase their consumption."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L2",
    "question": "Explain the Law Of Demand in the context of a Market Strategy scenario, specifically using the example of a consumer's demand for funnel cakes at an amusement park.",
    "answer": "The Law Of Demand states that, ceteris paribus, as the price of a product increases, the quantity demanded of that product decreases. In the context of an amusement park, if the price of a funnel cake rises, consumers will demand fewer funnel cakes, and if the price falls, consumers will demand more funnel cakes. This is because the price acts as a gatekeeper to the quantity purchased, influencing consumers' purchasing decisions.",
    "explanation": "The Law Of Demand can be represented by the demand equation: $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price. The demand curve, which is a graphical representation of the Law Of Demand, is typically downward-sloping, indicating that as price increases, quantity demanded decreases. This can be expressed as: $\frac{\\partial Q_d}{\\partial P} < 0$. In the amusement park scenario, if the price of a funnel cake increases, the quantity demanded decreases, and vice versa, illustrating the Law Of Demand in action."
  },
  {
    "id": "q4",
    "type": "order",
    "difficulty": "L2",
    "question": "Order steps for the Law Of Demand causal chain.",
    "steps": [
      "A higher price acts as a deterrent",
      "Consumers buy less of the product",
      "Ceteris Paribus (all else being equal)",
      "The quantity demanded of that product decreases",
      "As the price of a product increases"
    ],
    "answer": [
      "As the price of a product increases",
      "The quantity demanded of that product decreases",
      "Ceteris Paribus (all else being equal)",
      "A higher price acts as a deterrent",
      "Consumers buy less of the product"
    ]
  },
  {
    "id": "q5",
    "type": "trace",
    "difficulty": "L3",
    "question": "What is the exact output?",
    "content": "Assuming a 1% interest rate change, let's analyze its impact on 4 distinct economic sectors: Housing, Investment, Forex, and Consumption, and derive the final output based on the Law of Demand.",
    "answer": {
      "Housing Sector": "A 1% increase in interest rates will lead to higher mortgage rates, increasing the cost of borrowing for homebuyers. This will decrease the demand for housing, as higher mortgage rates make buying a home more expensive. Assuming an initial demand of 1000 housing units, a 1% interest rate hike might reduce demand to 980 units (2% reduction).",
      "Investment Sector": "A 1% increase in interest rates will make borrowing more expensive for businesses and investors. This will decrease the demand for investment projects, as higher interest rates increase the cost of capital. Assuming an initial demand for 500 investment projects, a 1% interest rate hike might reduce demand to 485 projects (3% reduction).",
      "Forex Sector": "A 1% increase in interest rates will make the domestic currency more attractive to foreign investors, causing the currency to appreciate. This will decrease the demand for exports, as they become more expensive for foreign buyers. Assuming an initial demand for 1000 units of exports, a 1% interest rate hike might reduce demand to 970 units (3% reduction).",
      "Consumption Sector": "A 1% increase in interest rates will increase the cost of borrowing for consumers, reducing their disposable income. This will decrease the demand for consumption goods, as consumers have less money to spend. Assuming an initial demand for 2000 consumption goods, a 1% interest rate hike might reduce demand to 1960 goods (2% reduction)."
    },
    "explanation": "The Law of Demand states that, ceteris paribus, as the price of a product increases, the quantity demanded decreases. In the context of a 1% interest rate change, we can represent the impact on each sector using the following equations:\n\nHousing Sector: $Q_d = 1000 - 20r$, where $r$ is the interest rate. A 1% increase in $r$ leads to $Q_d = 1000 - 20(0.01) = 980$.\n\nInvestment Sector: $Q_d = 500 - 15r$, where $r$ is the interest rate. A 1% increase in $r$ leads to $Q_d = 500 - 15(0.01) = 485$.\n\nForex Sector: $Q_d = 1000 - 30r$, where $r$ is the interest rate. A 1% increase in $r$ leads to $Q_d = 1000 - 30(0.01) = 970$.\n\nConsumption Sector: $Q_d = 2000 - 40r$, where $r$ is the interest rate. A 1% increase in $r$ leads to $Q_d = 2000 - 40(0.01) = 1960$.\n\nThe final output represents the new demand quantities in each sector after the 1% interest rate change.",
    "final_state": {
      "Housing Sector": 980,
      "Investment Sector": 485,
      "Forex Sector": 970,
      "Consumption Sector": 1960
    }
  }
]

```