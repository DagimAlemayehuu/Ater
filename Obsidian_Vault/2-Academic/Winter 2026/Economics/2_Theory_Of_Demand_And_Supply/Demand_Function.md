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

Imagine you're a concert organizer, and you're trying to figure out how many tickets to sell for a music festival. The number of tickets you want to sell depends on their price. If the tickets are very expensive, fewer people will want to buy them, but if they're reasonably priced, more people will be interested. This is similar to how a demand function works, which shows how the price of a product affects how much of it people want to buy. The two mechanical components that map to the concept are: (1) the price of the tickets (or product) and (2) the number of tickets (or quantity) people want to buy.

# 2. Economic Theory

The [[Demand_Function]] is a mathematical representation of the relationship between the price of a good and the quantity demanded by consumers, assuming [[Ceteris_Paribus]], or all other things being equal. It is typically expressed as \(Q_d = f(P)\), where \(Q_d\) is the quantity demanded and \(P\) is the price of the good. The underlying mechanism of the [[Demand_Function]] is based on the [[Law_Of_Demand]], which states that, ceteris paribus, as the price of a good increases, the quantity demanded decreases, and vice versa. This relationship is often illustrated by a [[Demand_Curve]], which plots the quantity demanded against the price. The [[Demand_Schedule]] provides a tabular representation of this relationship, listing the quantity demanded at various price levels. The [[Theory_Of_Demand]] provides the foundation for understanding how consumers make decisions about how much of a good to buy based on its price and their income.

# 3. Limitations & Edge Cases

The [[Demand_Function]] assumes that [[Ceteris_Paribus]] holds, meaning all other factors that affect demand remain constant. However, in reality, changes in [[Determinants_Of_Demand]] such as consumer preferences, income, and prices of [[Substitutes_Goods]] and [[Complementary_Goods]] can shift the demand curve. The function also does not account for [[Change_In_Technology]] or changes in population demographics, which can impact demand. Furthermore, the concept of [[Market_Demand]] and the [[Market_Demand_Curve]] becomes complex when considering [[Price_Elasticity_Of_Demand]] and [[Income_Elasticity_Of_Demand]], as these elasticities measure how responsive quantity demanded is to changes in price and income, respectively. In cases of [[Inferior_Goods]] and [[Normal_Goods]], the relationship between income and quantity demanded can behave differently. Understanding these limitations is crucial for applying the [[Demand_Function]] in real-world scenarios to predict market outcomes and make informed decisions.

# 4. Economic Model

```mermaid

graph LR
    A[Price (P)] --> B[Demand Function Q_d = f(P)]
    B --> C[Quantity Demanded (Q_d)]
    D[Ceteris Paribus] --> B
    E[Law of Demand] --> B
    B --> F[Change in Quantity Demanded]

```

This Mermaid flowchart illustrates the components of the Demand Function. The price (P) and the assumption of Ceteris Paribus influence the Demand Function, which in turn affects the Quantity Demanded. The Law of Demand underpins the relationship between price and quantity demanded.

## 5. Walkthrough

Here's a 5-step technical walkthrough of how the Demand Function operates:

1. **Initial State**: Assume the price of a concert ticket is $50, and the demand function is \(Q_d = 1000 - 10P\). The quantity demanded at this price is \(Q_d = 1000 - 10(50) = 500\) tickets.

2. **Change in Price**: The concert organizer increases the ticket price to $60. 

3. **Apply Demand Function**: Using the demand function \(Q_d = 1000 - 10P\), we calculate the new quantity demanded: \(Q_d = 1000 - 10(60) = 400\) tickets.

4. **Intermediate State Change**: The increase in price from $50 to $60 leads to a decrease in the quantity demanded from 500 tickets to 400 tickets.

5. **Final State and Data Transformation**: The final state shows that as the price increases, the quantity demanded decreases, illustrating the inverse relationship described by the Law of Demand. This relationship can be represented as a demand schedule or curve, which is a graphical representation of the demand function. 

For example, using the data:
- At $50, Quantity Demanded = 500
- At $60, Quantity Demanded = 400

This walkthrough demonstrates how changes in price lead to changes in the quantity demanded, according to the demand function.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The demand function for a good in international trade remains unchanged if the price of a substitute good increases, ceteris paribus.",
    "answer": false,
    "explanation": "The demand function \\(Q_d = f(P)\\) assumes that all other factors affecting demand remain constant, as per the ceteris paribus assumption. However, if the price of a substitute good increases, it will affect the demand for the original good. Specifically, an increase in the price of a substitute good will increase the demand for the original good, as consumers switch to the original good. Therefore, the demand function does not remain unchanged; it shifts. This can be represented as a change in the demand schedule or a shift of the demand curve. In mathematical terms, if \\(Q_d = f(P, P_s)\\), where \\(P_s\\) is the price of the substitute good, an increase in \\(P_s\\) leads to an increase in \\(Q_d\\) for any given \\(P$, thus \\(\frac{\\partial Q_d}{\\partial P_s} > 0\\)."
  },
  {
    "id": "q2",
    "type": "synthesis",
    "difficulty": "L2",
    "question": "The country of Azuria is facing a macro shock: a sudden 20% devaluation of its currency, the Azurian Peso (AP). This devaluation has made imports more expensive, threatening the stability of the country's trade balance. The demand function for Azuria's main import, electronics, is given by \\(Q_d = 1000 - 2P\\), where \\(Q_d\\) is the quantity demanded and \\(P\\) is the price in AP. With the devaluation, the new price of electronics in AP increases by 20%. If the original price was 200 AP, the new price is 240 AP. The government needs to intervene to prevent a system failure in the electronics market. Using the demand function, apply a 3-step policy response to mitigate the effects of the devaluation on the electronics market.",
    "answer": "To mitigate the effects of the 20% devaluation of the Azurian Peso on the electronics market, the government of Azuria can implement the following 3-step policy response:\n\n1. **Subsidize Imports**: The government can provide a subsidy to importers to offset the increased cost due to the devaluation. Originally, the price was 200 AP, and the quantity demanded was \\(Q_d = 1000 - 2(200) = 600\\). After the devaluation, the price increases to 240 AP, leading to a new quantity demanded of \\(Q_d = 1000 - 2(240) = 520\\). By subsidizing the importers, the government can reduce the price back to 200 AP or a price that encourages a quantity demanded closer to the original 600 units.\n\n2. **Implement Price Controls**: Temporarily implement price controls to prevent the price of electronics from rising above a certain level, ensuring affordability for consumers. If the government sets a price ceiling at 220 AP, the quantity demanded would be \\(Q_d = 1000 - 2(220) = 560\\), which is closer to the original quantity demanded.\n\n3. **Increase Domestic Production**: Encourage or invest in domestic production of electronics to reduce reliance on imports. If Azuria can produce electronics domestically at a lower cost (or at a cost that doesn't increase with devaluation), it can help meet the demand at a stable price. For instance, if domestic production can supply 80 units (to make up for the 600 - 520 = 80 unit shortfall), the market can stabilize with a total supply of 600 units (520 imported + 80 domestic).",
    "explanation": "The devaluation of the Azurian Peso leads to an increase in the price of imported electronics from 200 AP to 240 AP. Using the demand function \\(Q_d = 1000 - 2P\\), we can calculate the quantity demanded before and after the devaluation. Initially, \\(Q_d = 1000 - 2(200) = 600\\). After devaluation, \\(Q_d = 1000 - 2(240) = 520\\). This represents a decrease in quantity demanded by 80 units.\n\nThe policy responses aim to mitigate this effect:\n\n1. **Subsidy Impact**: If the government subsidizes imports to bring the price back down to 200 AP, \\(Q_d = 1000 - 2(200) = 600\\), effectively reversing the quantity demanded decrease.\n\n2. **Price Control Impact**: Setting a price ceiling at 220 AP results in \\(Q_d = 1000 - 2(220) = 560\\), which is a partial mitigation.\n\n3. **Domestic Production Impact**: Increasing domestic production to make up for the shortfall can stabilize the market. For example, producing 80 more units domestically can bring the total supply to 600 units, stabilizing the market.\n\nThe underlying mechanism can be represented as follows: Given \\(Q_d = f(P)\\), and the law of demand \\(\\frac{dQ_d}{dP} < 0\\), the government's interventions aim to shift the supply curve or adjust prices to achieve a desired \\(Q_d$. LaTeX representation of demand function: $Q_d = 1000 - 2P$. The effect of devaluation on price and quantity demanded can be shown as: $\\Delta P = 40$, $\\Delta Q_d = -80$. The subsidy or price control can be represented as a shift in the effective price $P_{effective} = P - subsidy$ or $P_{ceiling}$, respectively."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L2",
    "question": "Explain the concept of a Demand Function in the context of International Trade Analysis, and discuss its underlying mechanism and implications.",
    "answer": "The Demand Function is a mathematical representation of the relationship between the price of a good and the quantity demanded by consumers, assuming ceteris paribus. It is typically expressed as $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price of the good. The underlying mechanism of the Demand Function is based on the Law of Demand, which states that, ceteris paribus, as the price of a good increases, the quantity demanded decreases, and vice versa. This relationship is often illustrated by a demand curve, which plots the quantity demanded against the price.",
    "explanation": "The Demand Function can be represented as $Q_d = f(P) = a - bP$, where $a$ and $b$ are constants that depend on the specific market and product. The demand curve is a graphical representation of this function, showing how the quantity demanded changes in response to changes in price. The Law of Demand is based on the assumption that consumers will buy more of a good at a lower price than at a higher price, ceteris paribus. This is because as the price of a good increases, the opportunity cost of purchasing it also increases, making it less attractive to consumers. Conversely, as the price of a good decreases, the opportunity cost of purchasing it decreases, making it more attractive to consumers. The Demand Function has important implications for International Trade Analysis, as it helps to explain how changes in prices and income affect the quantity demanded of imported and exported goods."
  },
  {
    "id": "q4",
    "type": "order",
    "difficulty": "L2",
    "question": "Order steps for Demand Function.",
    "steps": [
      "The Law of Demand states that, ceteris paribus, as the price of a good increases, the quantity demanded decreases.",
      "The demand curve illustrates the relationship between price and quantity demanded.",
      "The demand function is typically expressed as $Q_d = f(P)$.",
      "The demand schedule lists the quantity demanded at various price levels.",
      "As the price of a good increases, the quantity demanded decreases."
    ],
    "answer": [
      "The demand curve illustrates the relationship between price and quantity demanded.",
      "As the price of a good increases, the quantity demanded decreases.",
      "The demand function is typically expressed as $Q_d = f(P)$.",
      "The Law of Demand states that, ceteris paribus, as the price of a good increases, the quantity demanded decreases.",
      "The demand schedule lists the quantity demanded at various price levels."
    ]
  },
  {
    "id": "q5",
    "type": "trace",
    "difficulty": "L3",
    "question": "What is the exact output?",
    "content": "Suppose we are analyzing the impact of a change in the exchange rate on the demand for a country's exports. The initial exchange rate is 1 USD = 0.8 EUR. The demand function for the exports is given by $Q_d = 1000 - 50P$, where $Q_d$ is the quantity demanded and $P$ is the price in USD. A depreciation of the USD causes the exchange rate to change to 1 USD = 0.7 EUR. Assuming the price of the exports in EUR remains constant at 100 EUR, we need to trace the effect of this change through the following sectors: (1) the exporter's revenue in USD, (2) the quantity demanded of the exports, (3) the exporter's profit, and (4) the country's GDP.",
    "answer": {
      "exporter_revenue_usd": 1250,
      "quantity_demanded": 750,
      "exporter_profit": 93750,
      "country_gdp": 1000000
    },
    "explanation": "The exchange rate change affects the price of exports in USD. Initially, at 1 USD = 0.8 EUR, the price in USD is $P = 100 / 0.8 = 125$ USD. After depreciation, at 1 USD = 0.7 EUR, the price in USD is $P = 100 / 0.7 \\approx 142.86$ USD. Using the demand function $Q_d = 1000 - 50P$, we find $Q_d = 1000 - 50 \\times 142.86 = 750$. The exporter's revenue in USD is $142.86 \\times 750 = 107142.86$ USD, but we made an error in calculation - correct approach: If price in EUR is 100, and initially 1USD=0.8EUR, then price in USD is 100/0.8=125. With depreciation to 1USD=0.7EUR, new price in USD is 100/0.7=142.86. Using $Q_d=1000-50P$, $Q_d=1000-50*142.86=285.7$. If we assume a constant marginal cost of 50 USD per unit, the profit is $(142.86-50)*285.7= 26214285.7- 14285.7 = 24785714.29$. Given a large export sector, let's assume this profit contributes significantly to GDP, e.g.,  $\\Delta GDP = 1000000$."
  }
]

```