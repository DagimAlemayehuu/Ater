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

Imagine you're a manager at a local ice cream parlor, and you're studying how the number of ice cream cones sold changes with the price you charge for each cone. The number of cones you sell depends on their price - if they're very cheap, you might sell a lot, but if they're very expensive, you might sell fewer. This relationship between the price of ice cream cones and the number of cones sold is similar to a demand curve, which shows how the quantity of a product demanded changes with its price. Just like how a high price for ice cream cones might lead to fewer sales, a high price for a product can lead to lower demand.

# 2. Economic Theory

The [[Demand_Curve]] is a graphical representation of the [[Law_Of_Demand]], which states that, [[Ceteris_Paribus]], as the price of a product increases, the quantity demanded of that product decreases. This inverse relationship between price and quantity demanded is the underlying mechanism of the demand curve, which can be expressed as a [[Demand_Function]] that relates the quantity demanded of a product to its price, as well as other factors such as [[Determinants_Of_Demand]], including [[Taste_And_Preference]], [[Number_Of_Buyers]], [[Consumer_Expectations]], and [[Income_Elasticity_Of_Demand]]. The [[Demand_Schedule]] is a table that shows the quantity demanded of a product at different price levels, which can be graphed to create the [[Demand_Curve]]. The demand curve is typically downward-sloping, indicating that as the price of a product increases, the quantity demanded decreases, and it is a fundamental concept in [[Theory_Of_Demand]].

# 3. Limitations & Edge Cases

The [[Demand_Curve]] model assumes that all other factors that affect demand, such as [[Taste_And_Preference]] and [[Income_Elasticity_Of_Demand]], remain constant, which is a limitation of the model. In reality, changes in these factors can shift the demand curve, leading to changes in demand that are not captured by the model. Additionally, the model assumes that consumers have perfect information about the market, which is not always the case. The [[Demand_Curve]] can also be affected by [[Substitutes_And_Complements]], [[Normal_And_Inferior_Goods]], and [[Change_In_Technology]], which can lead to edge cases where the traditional demand curve model does not apply. For example, in the case of [[Giffen_Goods]], an increase in price can lead to an increase in quantity demanded, which is an exception to the [[Law_Of_Demand]].

# 4. Economic Model

```mermaid

graph LR
    A[Price (P)] --> B[Quantity Demanded (Qd)]
    B --> C[Demand Curve (D)]
    C --> D[Market Equilibrium (E)]
    D --> E[Changes in Demand (∆D)]
    E --> F[Shifts in Demand Curve]

```

This Mermaid flowchart illustrates the relationship between the price of a product, the quantity demanded, and the demand curve. The demand curve shows how the quantity demanded changes with the price, and the market equilibrium point represents the balance between the quantity demanded and supplied.

## 5. Walkthrough

Here's a 5-step technical walkthrough of how the demand curve operates:

1. **Initial State**: Suppose the price of an ice cream cone is $2, and the quantity demanded is 100 cones per day. The demand curve is represented by the equation Qd = 120 - 10P, where Qd is the quantity demanded and P is the price.

2. **Price Increase**: If the price increases to $3, the quantity demanded decreases to 90 cones per day. This is represented by a movement up the demand curve.

3. **Demand Curve Shift**: Suppose a new ice cream parlor opens across the street, increasing competition and changing consumer preferences. The demand curve shifts to the left, representing a decrease in demand. The new demand curve equation becomes Qd = 100 - 10P.

4. **New Equilibrium**: At the new price of $3, the quantity demanded decreases to 70 cones per day, representing a new market equilibrium point.

5. **Changes in Demand**: If consumer preferences change again, and the demand curve shifts back to the right, the quantity demanded at the price of $3 increases to 80 cones per day. This represents a change in demand, resulting in a new market equilibrium point. 

The demand curve illustrates the inverse relationship between price and quantity demanded, and how changes in demand can shift the curve, leading to new market equilibrium points.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "If consumer incomes increase, the demand curve for a normal good shifts to the right, ceteris paribus.",
    "answer": true,
    "explanation": "The demand curve is typically represented by the equation $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price of the good. However, the ceteris paribus assumption implies that all other factors that affect demand, such as consumer income, are held constant. If consumer incomes increase, the demand for a normal good increases, causing the demand curve to shift to the right. This can be represented as an increase in $Q_d$ at each price level $P$, thus $Q_d = f(P, I)$, where $I$ is consumer income. When $I$ increases, the entire demand curve shifts to the right, indicating that at each price $P$, consumers are willing to buy more of the good."
  },
  {
    "id": "q2",
    "type": "synthesis",
    "difficulty": "L2",
    "question": "The country is facing a sudden and significant devaluation of its currency, leading to a sharp increase in the price of imported goods. This macro shock is causing a surge in inflation, which is expected to reduce the purchasing power of consumers. As a macroeconomist in the Fiscal Policy Research department, you need to apply the demand curve concept to mitigate the effects of this shock. The goal is to prevent a system failure in the economy by ensuring that the demand for essential goods and services remains stable. Present a 3-step policy response to address this emergency scenario.",
    "answer": "To address the sudden currency devaluation and its impact on inflation and demand, the following 3-step policy response is proposed:\n\n1. **Monetary Policy Adjustment**: The central bank should increase interest rates to curb inflationary pressures. Higher interest rates will make borrowing more expensive, which can help reduce consumption and investment, thereby mitigating the demand-pull inflation caused by the currency devaluation. However, this measure must be carefully calibrated to avoid stifling economic growth.\n\n2. **Fiscal Policy Intervention**: Implement targeted subsidies for essential goods and services to protect vulnerable populations from the effects of inflation. By subsidizing key sectors such as food, healthcare, and energy, the government can help maintain the purchasing power of consumers and ensure that the demand for these critical goods and services remains stable. This intervention can be financed through a combination of reallocating budgetary resources and implementing a temporary tax on luxury goods.\n\n3. **Supply-Side Policies**: Encourage domestic production of essential goods to reduce reliance on imports and mitigate the impact of the currency devaluation on prices. This can be achieved through a mix of incentives, such as tax breaks, investment in infrastructure, and support for research and development in key sectors. By enhancing domestic supply capabilities, the economy can become more resilient to external shocks and better equipped to maintain stable prices and demand.",
    "explanation": "The demand curve, a fundamental concept in economics, illustrates the inverse relationship between the price of a product and the quantity demanded, ceteris paribus. Mathematically, this relationship can be represented as $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price. The sudden devaluation of the currency leads to an increase in the prices of imported goods, which can be represented as a leftward shift of the supply curve, $S_1$ to $S_2$, in the supply-demand diagram. This shift results in a new equilibrium at a higher price ($P_2$) and a lower quantity demanded ($Q_2$). To mitigate these effects, the proposed policy response aims to stabilize the demand curve by adjusting monetary and fiscal policies and enhancing supply-side capabilities. The effectiveness of these measures can be understood through the lens of the IS-LM model and the aggregate demand-aggregate supply framework, where shifts in monetary and fiscal policies influence the aggregate demand curve, $AD$, and the economy's overall equilibrium."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L2",
    "question": "Explain the concept of a demand curve in the context of international trade analysis and its underlying mechanism using the law of demand.",
    "answer": "The demand curve is a graphical representation of the relationship between the price of a product and the quantity demanded by consumers, illustrating that as the price increases, the quantity demanded decreases, and vice versa. In international trade analysis, the demand curve is crucial for understanding how changes in prices, due to tariffs, quotas, or exchange rates, affect the quantity of imports and exports. The law of demand, which states that 'ceteris paribus' (all else being equal), as the price of a product increases, the quantity demanded decreases, is the underlying mechanism driving the demand curve. This relationship is typically represented as $Q_d = f(P)$, where $Q_d$ is the quantity demanded and $P$ is the price. The demand curve is downward sloping, indicating an inverse relationship between price and quantity demanded.",
    "explanation": "The demand curve in international trade analysis can be understood through the lens of the law of demand, which is often expressed as $Q_d = f(P)$. Here, $Q_d$ represents the quantity demanded of a good, and $P$ represents its price. The function $f(P)$ indicates that the quantity demanded is a function of the price. According to the law of demand, as $P$ increases, $Q_d$ decreases, and vice versa, assuming 'ceteris paribus' (all other factors remain constant). This inverse relationship is graphically represented by a downward-sloping demand curve. In the context of international trade, the demand curve helps analysts and policymakers understand how changes in prices, such as those caused by tariffs, quotas, or fluctuations in exchange rates, impact the quantity of goods traded internationally. For instance, if a country imposes a tariff on imported goods, the price of these goods increases, leading to a decrease in the quantity demanded, as illustrated by the movement up and to the left along the demand curve. Conversely, a decrease in tariffs reduces the price of imported goods, leading to an increase in the quantity demanded, represented by a movement down and to the right along the demand curve."
  },
  {
    "id": "q4",
    "type": "order",
    "difficulty": "L2",
    "question": "Order steps for Demand Curve",
    "steps": [
      "The Law of Demand states that there is an inverse relationship between price and quantity demanded.",
      "As the price of a product increases, consumers' purchasing power decreases, leading to lower demand.",
      "The demand curve is typically downward sloping, illustrating the inverse relationship between price and quantity demanded.",
      "Ceteris Paribus, as the price of a product increases, the quantity demanded of that product decreases.",
      "A graphical representation of this relationship is the demand curve, which shows how the quantity of a product demanded changes with its price."
    ],
    "answer": [
      "As the price of a product increases, consumers' purchasing power decreases, leading to lower demand.",
      "The demand curve is typically downward sloping, illustrating the inverse relationship between price and quantity demanded.",
      "Ceteris Paribus, as the price of a product increases, the quantity demanded of that product decreases.",
      "The Law of Demand states that there is an inverse relationship between price and quantity demanded.",
      "A graphical representation of this relationship is the demand curve, which shows how the quantity of a product demanded changes with its price."
    ]
  },
  {
    "id": "q5",
    "type": "trace",
    "difficulty": "L3",
    "question": "What is the exact output?",
    "content": "The demand curve is a graphical representation of the Law of Demand, which states that, ceteris paribus, as the price of a product increases, the quantity demanded of that product decreases. We need to trace the impact of a 1% interest rate change through 4 distinct economic sectors: Housing, Investment, Forex, and Consumption.",
    "answer": {
      "Housing": "A 1% increase in interest rates will lead to a decrease in housing demand by 0.5% due to increased mortgage costs, resulting in a shift to the left of the housing demand curve.",
      "Investment": "A 1% increase in interest rates will lead to a decrease in investment by 1.2% due to increased borrowing costs, resulting in a shift to the left of the investment demand curve.",
      "Forex": "A 1% increase in interest rates will lead to an appreciation of the currency by 0.8% due to increased foreign investment, resulting in a shift to the right of the forex demand curve.",
      "Consumption": "A 1% increase in interest rates will lead to a decrease in consumption by 0.2% due to decreased disposable income, resulting in a shift to the left of the consumption demand curve."
    },
    "explanation": "The impact of a 1% interest rate change through the 4 distinct economic sectors can be explained using the following LaTeX equations:\n\nHousing: $Q_h = -0.5 \\times \\Delta r$\nInvestment: $Q_i = -1.2 \\times \\Delta r$\nForex: $Q_f = 0.8 \\times \\Delta r$\nConsumption: $Q_c = -0.2 \\times \\Delta r$\n\nwhere $Q_h, Q_i, Q_f, Q_c$ represent the changes in housing, investment, forex, and consumption demand respectively, and $\\Delta r$ represents the 1% change in interest rates.\n\nThe demand curve for each sector can be represented as:\n\n$P = f(Q)$\n\nwhere $P$ represents the price and $Q$ represents the quantity demanded.\n\nThe shifts in the demand curves can be represented graphically, showing the changes in the quantity demanded in response to the 1% interest rate change."
  }
]

```