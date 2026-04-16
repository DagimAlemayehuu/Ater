---
title: Quartiles_Deciles_And_Percentiles
created_at: '2025-12-04T10:03:59Z'
last_modified: '2025-12-04T10:03:59Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: b5ca4ec6-cebf-4fb9-ae8a-46d409ca9b35
type: Core
course: Statistics_And_Probability
year: Year_II
semester: Semester_I
credits: 3
original_source: Lecture_Slides_and_Course_Outline
aliases: 
- Positional_Measures
- Quantiles
unit: 4_Measures_Of_Central_Tendency
parent: Median
---

# Definition
Before proceeding, ensure you master Data_Ordering and Measures_Of_Position.
[[Quartiles_Deciles_and_Percentiles]] are collectively known as **quantiles** or **positional measures**. They are values that divide an ordered dataset into equal parts, providing more detailed insights into the distribution of data beyond just the single middle value (the [[Median]]).
*   **Quartiles** divide the data into **four** equal parts.
*   **Deciles** divide the data into **ten** equal parts.
*   **Percentiles** divide the data into **one hundred** equal parts.
These measures help to understand the spread and concentration of data points relative to specific positions within the ordered set.

# The Mental Model
Imagine a long academic year for students, where each student has their final grade. If you want to know who is in the "top quarter" or "bottom quarter," you need Quartiles. If you want to know how a student performed relative to the "top 10%" or "bottom 10%," you need Deciles. And for a very precise ranking, like "better than 85% of their peers," you use Percentiles. These are all just specific "markers" along a sorted line of data, helping you to pinpoint relative positions rather than just the absolute middle.

# Context & Framework
### How the Parts Talk to Each Other
[[Quartiles_Deciles_and_Percentiles]] build directly upon the concept of the [[Median]]. The median is, in fact, the 2nd quartile, the 5th decile, and the 50th percentile. This hierarchical relationship highlights that all these measures are fundamentally positional. Their calculation relies on the same initial step: ordering the data. They differ only in how many equal segments they divide the data into, providing increasingly granular insights into the internal structure of the distribution.

# The Mastery Deep Dive
### Anatomy of the Formula (Who is Who?)
The general approach for calculating quartiles, deciles, and percentiles for both ungrouped and grouped data involves finding their position and then determining the value at that position.

**For Ungrouped Data:**
1.  **Arrange the data** in ascending order.
2.  **Calculate the position (P) of the desired quantile:**
    *   For the $j^{\text{th}}$ Quartile ($Q_j$): $\text{Position of } Q_j = \frac{j(n+1)}{4}$
    *   For the $j^{\text{th}}$ Decile ($D_j$): $\text{Position of } D_j = \frac{j(n+1)}{10}$
    *   For the $j^{\text{th}}$ Percentile ($P_j$): $\text{Position of } P_j = \frac{j(n+1)}{100}$
    Where $n$ is the total number of observations, and $j$ is the desired quartile (1, 2, 3), decile (1-9), or percentile (1-99).
3.  **Identify the value:** If the position is an integer, it's the value at that position. If it's a fractional position (e.g., 2.5), interpolate between the two adjacent values.

**For Grouped Frequency Distribution (GFD):**
1.  **Calculate the cumulative frequencies.**
2.  **Find the position (P) of the desired quantile:**
    *   For the $j^{\text{th}}$ Quartile ($Q_j$): $\text{Position of } Q_j = \frac{jN}{4}$
    *   For the $j^{\text{th}}$ Decile ($D_j$): $\text{Position of } D_j = \frac{jN}{10}$
    *   For the $j^{\text{th}}$ Percentile ($P_j$): $\text{Position of } P_j = \frac{jN}{100}$
    Where $N$ is the total frequency.
3.  **Identify the quantile class:** This is the class interval where the calculated position falls (i.e., the first class whose cumulative frequency is greater than or equal to the position).
4.  **Apply the interpolation formula (similar to the median):**
    $$ \boxed{\displaystyle \text{Quantile} = L + \left(\frac{P - cf}{f}\right) \times h} $$
    Where:
    *   $L$: Lower class boundary of the quantile class.
    *   $P$: Position of the desired quantile.
    *   $cf$: Cumulative frequency of the class *preceding* the quantile class.
    *   $f$: Frequency of the quantile class.
    *   $h$: Class interval (width) of the quantile class.

This systematic approach ensures accurate quantile calculation for all data structures.

### The "Duh!" Moment (Intuitive Proof)
The existence of [[Quartiles_Deciles_and_Percentiles]] is intuitively sound because we often want to know more than just the absolute middle of a group. For instance, in a race, knowing the median finishing time is good, but knowing the time of the person who finished in the top 25% (1st Quartile) or who was faster than 90% of the runners (90th Percentile) provides much richer, more actionable information. These measures simply formalize our natural desire to break down and understand the relative performance or position of elements within an ordered whole.

# Constraints & Limitations
### The "Oops!" List: Where Everyone Fails
A common error when calculating [[Quartiles_Deciles_and_Percentiles]] for grouped data is incorrectly identifying the quantile class or using the wrong cumulative frequency ($cf$) in the interpolation formula. It's crucial that $cf$ refers to the cumulative frequency of the class *preceding* the quantile class, not the quantile class itself. Another pitfall, especially with ungrouped data, is confusing the formula for position, particularly the $(n+1)$ factor which is used for discrete data and provides a more consistent interpolation for small datasets. Always double-check the formula for the specific quantile (quartile, decile, percentile) being calculated.

# Significance & Application
[[Quartiles_Deciles_and_Percentiles]] are highly significant for detailed data analysis and interpretation across diverse fields:
*   **Education:** Ranking student performance (e.g., 75th percentile on a standardized test means performing better than 75% of test-takers).
*   **Healthcare:** Analyzing patient data, such as growth charts (children's weight/height percentiles) or medication response rates.
*   **Economics and Finance:** Examining income inequality (e.g., income of the top 10% or bottom 25%), or evaluating investment performance benchmarks.
*   **Quality Control:** Setting thresholds for acceptable product dimensions or performance.
They provide a granular view of data distribution, enabling better decision-making and targeted interventions based on specific segments of the population.

# The Worked Example
*Test your mastery. Cover the solutions below to test yourself first.*

Example: The following GFD refers to the weight (to the nearest Kg) of a sample of students. Find the 1st Quartile ($Q_1$), the 7th Decile ($D_7$), and the 39th Percentile ($P_{39}$).

| Weight (in Kg) | Number of students (f) | Cum. Frequency (cf) |
| :
------------- | :
--------------------- | :
------------------ |
| 35 - 43        | 8                      | 8                   |
| 44 - 52        | 11                     | 19                  |
| 53 - 61        | 16                     | 35                  |
| 62 - 70        | 19                     | 54                  |
| 71 - 79        | 14                     | 68                  |
| 80 - 88        | 9                      | 77                  |

Total frequency $N = 77$. Class interval $h=9$.

**1. Calculate the 1st Quartile ($Q_1$):**
**Step 1: Find the position of $Q_1$.**
Position of $Q_1 = \frac{1 \times N}{4} = \frac{1 \times 77}{4} = 19.25^{\text{th}}$ position.
**Step 2: Identify the $Q_1$ class.**
The 19.25th position falls in the class 53 - 61 (cf=35).
**Step 3: Identify values for the interpolation formula.**
*   $L = 52.5$
*   $P = 19.25$
*   $cf = 19$ (cf of preceding class 44-52)
*   $f = 16$ (frequency of $Q_1$ class)
*   $h = 9$
**Step 4: Apply the interpolation formula.**
$$ \begin{aligned}
\displaystyle Q_1 &= L + \left(\frac{P - cf}{f}\right) \times h \\
&= 52.5 + \left(\frac{19.25 - 19}{16}\right) \times 9 \\
&= 52.5 + \left(\frac{0.25}{16}\right) \times 9 \\
&= 52.5 + 0.015625 \times 9 \\
&= 52.5 + 0.140625 \\
&\approx 52.64 \text{ Kg}
\end{aligned} $$
Interpretation: Approximately 25% of students weigh less than or equal to 52.64 Kg.

**2. Calculate the 7th Decile ($D_7$):**
**Step 1: Find the position of $D_7$.**
Position of $D_7 = \frac{7 \times N}{10} = \frac{7 \times 77}{10} = 53.9^{\text{th}}$ position.
**Step 2: Identify the $D_7$ class.**
The 53.9th position falls in the class 62 - 70 (cf=54). This is the class whose cumulative frequency just exceeds the position.
**Step 3: Identify values for the interpolation formula.**
*   $L = 61.5$
*   $P = 53.9$
*   $cf = 35$ (cf of preceding class 53-61)
*   $f = 19$ (frequency of $D_7$ class)
*   $h = 9$
**Step 4: Apply the interpolation formula.**
$$ \begin{aligned}
\displaystyle D_7 &= L + \left(\frac{P - cf}{f}\right) \times h \\
&= 61.5 + \left(\frac{53.9 - 35}{19}\right) \times 9 \\
&= 61.5 + \left(\frac{18.9}{19}\right) \times 9 \\
&= 61.5 + 0.9947 \times 9 \\
&= 61.5 + 8.9523 \\
&\approx 70.45 \text{ Kg}
\end{aligned} $$
Interpretation: Approximately 70% of students weigh less than or equal to 70.45 Kg.

**3. Calculate the 39th Percentile ($P_{39}$):**
**Step 1: Find the position of $P_{39}$.**
Position of $P_{39} = \frac{39 \times N}{100} = \frac{39 \times 77}{100} = 30.03^{\text{th}}$ position.
**Step 2: Identify the $P_{39}$ class.**
The 30.03th position falls in the class 53 - 61 (cf=35).
**Step 3: Identify values for the interpolation formula.**
*   $L = 52.5$
*   $P = 30.03$
*   $cf = 19$ (cf of preceding class 44-52)
*   $f = 16$ (frequency of $P_{39}$ class)
*   $h = 9$
**Step 4: Apply the interpolation formula.**
$$ \begin{aligned}
\displaystyle P_{39} &= L + \left(\frac{P - cf}{f}\right) \times h \\
&= 52.5 + \left(\frac{30.03 - 19}{16}\right) \times 9 \\
&= 52.5 + \left(\frac{11.03}{16}\right) \times 9 \\
&= 52.5 + 0.689375 \times 9 \\
&= 52.5 + 6.204375 \\
&\approx 58.70 \text{ Kg}
\end{aligned} $$
Interpretation: Approximately 39% of students weigh less than or equal to 58.70 Kg.

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** For the following sorted dataset: 10, 12, 15, 18, 20, 22, 25, 28, 30. Find the 3rd Quartile ($Q_3$).
> **Solution:** $n=9$. Position of $Q_3 = \frac{3(9+1)}{4} = \frac{30}{4} = 7.5^{\text{th}}$ position.
> This means it's halfway between the 7th and 8th values.
> 7th value = 25, 8th value = 28.
> $Q_3 = \frac{25+28}{2} = 26.5$.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You have a grouped frequency distribution representing the duration of customer service calls (in minutes):

| Duration (minutes) | Number of Calls |
| :
----------------- | :
-------------- |
| 0 - 4              | 10              |
| 5 - 9              | 25              |
| 10 - 14            | 40              |
| 15 - 19            | 30              |
| 20 - 24            | 15              |

1.  Calculate the 8th Decile ($D_8$) for this dataset.
2.  Suppose the value of the 2nd Quartile ($Q_2$) for this dataset was calculated to be 11.25 minutes. Explain the relationship between this $Q_2$ value and the 5th Decile ($D_5$) and the 50th Percentile ($P_{50}$), without performing additional calculations for $D_5$ and $P_{50}$.
> **Solution:**
> 1.  **Calculate Cumulative Frequencies:**
>     | Duration (minutes) | f  | cf  |
>     | :
----------------- | :
--- | :
---- |
>     | 0 - 4              | 10 | 10  |
>     | 5 - 9              | 25 | 35  |
>     | 10 - 14            | 40 | 75  |
>     | 15 - 19            | 30 | 105 $\leftarrow D_8$ Class |
>     | 20 - 24            | 15 | 120 |
>     Total Frequency $N = 120$. Class interval $h = 4-0+1 = 5$.
>     **Find the position of $D_8$.**
>     Position of $D_8 = \frac{8 \times N}{10} = \frac{8 \times 120}{10} = 96^{\text{th}}$ position.
>     **Identify values for the interpolation formula.**
>     The 96th position falls in the class 15 - 19.
>     $L = 14.5$ (lower class boundary)
>     $P = 96$
>     $cf = 75$ (cumulative frequency of preceding class)
>     $f = 30$ (frequency of $D_8$ class)
>     $h = 5$ (class interval)
>     **Apply interpolation formula:**
>     $D_8 = 14.5 + \left(\frac{96 - 75}{30}\right) \times 5$
>     $D_8 = 14.5 + \left(\frac{21}{30}\right) \times 5$
>     $D_8 = 14.5 + 0.7 \times 5$
>     $D_8 = 14.5 + 3.5 = 18$ minutes.
> 2.  The 2nd Quartile ($Q_2$), the 5th Decile ($D_5$), and the 50th Percentile ($P_{50}$) are all equivalent to the [[Median]] of the dataset. Therefore, if $Q_2$ is calculated as 11.25 minutes, then $D_5$ and $P_{50}$ for the same dataset would also be 11.25 minutes. They represent the same central positional measure, just expressed through different scales of division (quarters, tenths, hundredths).

# Key Takeaways
*   [[Quartiles_Deciles_and_Percentiles]] are positional measures that divide ordered data into four, ten, and one hundred equal parts, respectively.
*   The [[Median]] is equivalent to the 2nd quartile, 5th decile, and 50th percentile.
*   Calculations involve finding a position within the ordered data (or cumulative frequency) and then either directly identifying the value (ungrouped) or using an interpolation formula (grouped).

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| Data_Ordering           | All these measures fundamentally rely on sorting the data in ascending or descending order. |
| Measures_Of_Position    | They are the primary examples of measures of position within a dataset.                     |
| [[Median]]                  | The median is a specific instance of these broader quantile measures.                      |
| Grouped_Frequency_Distribution | Specific interpolation formulas are used to calculate these measures for grouped data.      |
| Data_Distribution       | They provide a detailed view of the spread and concentration of data within its distribution. |
---