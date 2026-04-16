---
title: "Karl_Pearson_Correlation_Coefficient"
type: "Core"
course: "[[Statistics And Probability]]"
semester: "[[Semester I]]"
unit: "7 Correlation And Regression Analysis"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.110093"
last_edited_time: "2026-04-16T13:47:45.110094"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[Correlation_Analysis]] and Linear_Relationships because Karl Pearson's correlation coefficient is the most common measure of the strength and direction of a linear relationship between two quantitative variables.
**Karl Pearson's correlation coefficient**, often denoted by 'r', is a numerical measure that quantifies the strength and direction of the linear relationship between two quantitative variables. It is always a number between -1 and +1, inclusive. A value of +1 indicates a perfect positive linear correlation, -1 indicates a perfect negative linear correlation, and 0 indicates no linear correlation. A simpler way to think about it is a "score" that tells you how perfectly two things move together in a straight line.

# The Mental Model
Imagine a tug-of-war between two teams (your two variables).
*   If `r = +1`, it's like both teams are pulling perfectly in the same direction, with the same strength. A perfect sync.
*   If `r = -1`, it's like they're pulling perfectly in opposite directions, with equal strength. Still a perfect sync, but opposite.
*   If `r = 0`, it's like they're both just standing there, or pulling randomly. No coordinated movement.
Any value between -1 and +1 indicates a partial agreement, and the closer to +1 or -1, the stronger the coordinated pull.

# Context & Framework
### The Problem: Quantifying Linear Associations Precisely
While [[Scatter_Diagram]]s provided a visual sense of linear relationships, a precise numerical measure was needed to objectively quantify the strength and direction of these associations. Karl Pearson, a prominent statistician, developed his product-moment correlation coefficient in the late 19th century to address this need. His formula provided a standardized value, independent of the units of measurement, that directly indicated how closely two variables moved together in a linear fashion. This advancement allowed for rigorous comparisons between different studies and transformed the qualitative observation of relationships into a precise, universally understood quantitative metric, becoming a cornerstone of modern statistical analysis.

# The Mastery Deep Dive
### Step-by-Step Derivation
The Karl Pearson correlation coefficient ($r$) is calculated using the following formula:

$$ \boxed{\displaystyle r = \frac{n\sum XY - (\sum X)(\sum Y)}{\sqrt{[n\sum X^2 - (\sum X)^2][n\sum Y^2 - (\sum Y)^2]}}} \quad \text{(Pearson's Correlation Coefficient Formula)}$$

Where:
*   $n$: Number of data points (pairs of X and Y values)
*   $\sum X$: Sum of all X values
*   $\sum Y$: Sum of all Y values
*   $\sum XY$: Sum of the product of each X and Y pair
*   $\sum X^2$: Sum of the squared X values
*   $\sum Y^2$: Sum of the squared Y values

**Example Calculation:**
Let's use the advertising expense (X) and products sold (Y) example from previous notes, and explicitly calculate Karl Pearson's $r$.

| x | y | xy  | x^2 | y^2 |
| :- | :- | :-- | :-- | :-- |
| 4 | 15 | 60 | 16 | 225 |
| 5 | 18 | 90 | 25 | 324 |
| 6 | 18 | 108 | 36 | 324 |
| 8 | 20 | 160 | 64 | 400 |
| 9 | 22 | 198 | 81 | 484 |
| **32** | **93** | **616** | **222** | **1757** |

From the table:
*   $n = 5$
*   $\sum X = 32$
*   $\sum Y = 93$
*   $\sum XY = 616$
*   $\sum X^2 = 222$
*   $\sum Y^2 = 1757$

Substitute these values into the formula:
$$ \displaystyle r = \frac{5(616) - (32)(93)}{\sqrt{[5(222) - (32)^2][5(1757) - (93)^2]}} \quad \text{(Substitute values into the formula)} $$
$$ \displaystyle r = \frac{3080 - 2976}{\sqrt{[1110 - 1024][8785 - 8649]}} \quad \text{(Perform multiplication and squaring)} $$
$$ \displaystyle r = \frac{104}{\sqrt{}} \quad \text{(Perform subtraction)} $$
$$ \displaystyle r = \frac{104}{\sqrt{11696}} \quad \text{(Multiply terms in denominator)} $$
$$ \displaystyle r = \frac{104}{108.1480} \quad \text{(Calculate square root)} $$
$$ \boxed{\displaystyle r \approx 0.9616} \quad \text{(Calculate final value)} $$

**Interpretation:**
A Pearson's $r$ of approximately 0.9616 indicates a very strong positive linear relationship between advertising expense and products sold. This means as advertising expense increases, products sold tend to increase significantly and consistently.

# Constraints & Limitations
### The "Oops!" List: Sensitivity to Outliers
Karl Pearson's correlation coefficient is highly sensitive to **outliers** (extreme data points). This is a significant "trap" because:
1.  **Distorted Magnitude:** A single outlier can dramatically inflate or deflate the value of $r$, making a weak relationship appear strong, or a strong relationship appear weak, or even changing the sign of the correlation. For example, if most data points show a moderate positive correlation, but one extreme point exists far from the trend, $r$ might shift considerably to accommodate it, misrepresenting the majority of the data.
2.  **Assumption of Normality (less strict for $r$ itself, but for inference):** While $r$ can be computed for any two variables, its interpretation for statistical inference (e.g., hypothesis testing) assumes that the data are drawn from a bivariate normal distribution.
Therefore, always visually inspect your data using a [[Scatter_Diagram]] before calculating $r$, and consider whether outliers are true data points or errors, as they can heavily bias your correlation measure.

# Significance & Application
Karl Pearson's correlation coefficient is one of the most widely used statistical measures for quantifying linear relationships, offering a clear and standardized metric. In **finance**, it's used to measure the correlation between different stocks or assets to inform portfolio diversification. In **psychology**, it might quantify the linear relationship between test scores from two different assessments. In **engineering**, it could measure the linear association between a component's temperature and its operational lifespan. Its benefits include:
*   **Standardized Measure:** Easy to interpret as it always falls between -1 and +1.
*   **Direction and Strength:** Conveys both the direction (positive/negative) and strength (magnitude) of the linear relationship.
*   **Foundation for Regression:** Its square ($r^2$) directly relates to the [[Coefficient_of_Determination]] in simple linear regression.
It provides a fundamental understanding of how two quantitative variables linearly relate.

# The Worked Example
Let's use one of the examples from the lecture slides to calculate Karl Pearson's correlation coefficient. We will use the data provided for "Number of items produced" and "Cost incurred" (lecture slides 44-47/76).

**Example Data and Sums (from lecture slide 46/76):**
*   $n = 5$
*   $\sum x = 32$
*   $\sum y = 93$
*   $\sum xy = 616$
*   $\sum x^2 = 222$
*   $\sum y^2 = 1757$

**Step 1: Calculate the numerator.**
$$ \displaystyle \text{Numerator} = n\sum xy - (\sum x)(\sum y) $$
$$ \displaystyle \text{Numerator} = 5(616) - (32)(93) \quad \text{(Substitute values)} $$
$$ \displaystyle \text{Numerator} = 3080 - 2976 \quad \text{(Perform multiplication)} $$
$$ \displaystyle \text{Numerator} = 104 \quad \text{(Perform subtraction)} $$

**Step 2: Calculate the terms under the square root in the denominator.**
*   Term 1: $n\sum x^2 - (\sum x)^2$
    $$ \displaystyle 5(222) - (32)^2 = 1110 - 1024 = 86 \quad \text{(Calculate first term)} $$
*   Term 2: $n\sum y^2 - (\sum y)^2$
    $$ \displaystyle 5(1757) - (93)^2 = 8785 - 8649 = 136 \quad \text{(Calculate second term)} $$

**Step 3: Calculate the denominator.**
$$ \displaystyle \text{Denominator} = \sqrt{(\text{Term 1}) \times (\text{Term 2})} $$
$$ \displaystyle \text{Denominator} = \sqrt{86 \times 136} \quad \text{(Multiply terms)} $$
$$ \displaystyle \text{Denominator} = \sqrt{11696} \quad \text{(Calculate square root)} $$
$$ \displaystyle \text{Denominator} \approx 108.14804 \quad \text{(Approximate value)} $$

**Step 4: Calculate Karl Pearson's correlation coefficient ($r$).**
$$ \displaystyle r = \frac{\text{Numerator}}{\text{Denominator}} $$
$$ \displaystyle r = \frac{104}{108.14804} \quad \text{(Divide numerator by denominator)} $$
$$ \boxed{\displaystyle r \approx 0.9616} \quad \text{(Round to four decimal places)} $$
This matches the calculation shown on lecture slide 47/76 (where $104 / 108.15 \approx 0.96$).

**Interpretation:**
A correlation coefficient of approximately **0.96** indicates a very strong positive linear relationship between the number of items produced and the cost incurred. This means that as more items are produced, the cost tends to increase very consistently.

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Variable ID:** What is the possible range of values for Karl Pearson's correlation coefficient?
> **Solution:** Karl Pearson's correlation coefficient ranges from -1 to +1, inclusive.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Impossible Case:** A researcher investigates the linear relationship between the amount of sleep (X) and reaction time (Y) in milliseconds. Most participants show a moderate negative linear correlation (more sleep, faster reaction time). However, one participant (an insomniac) has extremely low sleep (X=1 hour) but also an unexpectedly fast reaction time (Y=150 ms) due to adrenaline. Explain how this outlier might lead to the "Sensitivity to Outliers" trap (as discussed in `# Constraints & Limitations`) when calculating Karl Pearson's $r$. How could this single data point distort the coefficient, and what alternative correlation measure might be less affected?
> **Solution:** This scenario perfectly exemplifies the "Sensitivity to Outliers" trap for Karl Pearson's $r$. The single outlier (insomniac with low sleep, fast reaction) is far removed from the general trend of "more sleep, faster reaction time." Since Pearson's $r$ uses the actual values of each data point, this extreme outlier can **significantly pull the regression line towards itself**, thereby distorting the calculated $r$ value. It could weaken an otherwise strong negative correlation, or even shift it towards zero, making it seem like sleep has less impact than it truly does for the majority of the population. The "impossible case" is that this single, potentially unrepresentative, data point could drastically alter the measure of association for the entire group.
> A more robust alternative correlation measure that would be less affected by this outlier is [[Spearman_Correlation_Coefficient]]. Spearman's rho uses the *ranks* of the data rather than their raw values, making it less sensitive to extreme observations and thus a better choice when outliers are present or when the distribution is not normal.

# Key Takeaways
*   Karl Pearson's correlation coefficient ($r$) measures the strength and direction of linear relationships.
*   It ranges from -1 (perfect negative) to +1 (perfect positive), with 0 indicating no linear correlation.
*   It is calculated using a formula involving sums of X, Y, and their products and squares.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                          |
| :
-------------------------- | :
----------------------------------------------------------------- |
| [[Correlation_Analysis]]    | Karl Pearson's coefficient is a primary quantitative measure used in correlation analysis. |
| Linear_Relationships    | This coefficient specifically quantifies the strength and direction of linear relationships. |
| [[Scatter_Diagram]]         | The value of Pearson's $r$ should be interpreted in conjunction with a scatter diagram. |
| [[Coefficient_of_Determination]]| The square of Pearson's $r$ ($r^2$) is the coefficient of determination for simple linear regression. |
| Outliers                | Pearson's $r$ is sensitive to outliers, which can distort its value. |
---