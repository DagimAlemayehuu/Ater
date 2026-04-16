---
title: CC2131_4_Directed_Graphs_Possible_Questions
created_at: '2026-01-18T11:29:47Z'
last_modified: '2026-01-18T11:29:47Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 30fa6b29-4640-4fed-a1a0-2adbdea97916
type: Questions
course: Discrete_Mathematics
year: Year_II
semester: Semester_I
credits: 3
original_source: Chapter_Four_Directed_Graphs_Slides
aliases: []
unit: 4_Directed_Graphs
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[Directed_Graph_Fundamentals]]
### Level 1: Understanding (The Basics)
1.  **The Component Check:** Given the set representation $V = \{x, y, z\}$ and $E = \{(x, y), (y, z), (z, z)\}$, identify all vertices that act as a "Tail" in at least one edge.
### Level 2: Competence (Application)
2.  **The Sort:** Given a list of graph elements—$(u, v)$, $\{u, v\}$, Loop, Arc—categorize them into "Directed Graph Components" and "Undirected Graph Components".
### Level 3: Mastery (The Crucible)
3.  **The Impostor:** You are analyzing a system that claims to be a valid **Sub-Digraph** of $G$. The Sub-Digraph contains edge $(A, B)$, but vertex $B$ is missing from its vertex set. Explain why this is impossible and violates the definition of a digraph.

## [[Vertex_Degrees_in_Digraphs]]
### Level 1: Understanding (The Basics)
4.  **The Variable ID:** In the equation $\sum \text{deg}^-(v) = |E|$, what physical quantity does $|E|$ represent in a traffic network analogy?
### Level 2: Competence (Application)
5.  **The Standard Solver:** A graph has 5 vertices. The in-degrees are 2, 2, 1, 1, and 3. What is the sum of the out-degrees?
### Level 3: Mastery (The Crucible)
6.  **The Impossible Case:** A student claims to have drawn a digraph with 3 edges where the sum of In-Degrees is 3 and the sum of Out-Degrees is 4. Explain, using the Handshaking Lemma, why this graph cannot exist.

## [[Matrix_Representations_of_Digraphs]]
### Level 1: Understanding (The Basics)
7.  **The Component Check:** In an Adjacency Matrix $A$, does the entry $A_{23}$ represent an edge from Vertex 2 to 3, or from 3 to 2?
### Level 2: Competence (Application)
8.  **The Clean Build:** Construct the Adjacency Matrix for a graph with vertices $\{1, 2, 3\}$ and edges $1 \to 2$, $2 \to 3$, and $3 \to 1$.
```text
// Scenario: Matrix Construction
// Expected Output:
// [[0, 1, 0],
//  [0, 0, 1],
//  [1, 0, 0]]
```
### Level 3: Mastery (The Crucible)
9.  **The Broken System:** You are given an **Incidence Matrix** where one column contains two '1's and no '-1's. What rule of standard incidence matrices does this violate, and what would this physically imply about the edge?

## [[Connectivity_in_Directed_Graphs]]
### Level 1: Understanding (The Basics)
10. **The Neighbor Check:** If a graph is "Strongly Connected", does it imply that it is also "Weakly Connected"?
### Level 2: Competence (Application)
11. **The Sort:** You have three graphs:
    *   Graph A: Cycle $1 \to 2 \to 1$.
    *   Graph B: Line $1 \to 2 \to 3$.
    *   Graph C: Disconnected $1 \to 2$, $3 \to 4$.
    Categorize them as Strongly, Unilaterally, or Disconnected.
### Level 3: Mastery (The Crucible)
12. **The Impostor:** Consider a graph that is **Weakly Connected** but **Not Unilaterally Connected**. Describe the structure of such a graph (e.g., using 3 vertices) and explain why the "Unilateral" test fails.

## [[Rooted_Tree_Structures]]
### Level 1: Understanding (The Basics)
13. **The Variable ID:** In a tree rooted at $R$, what is the specific In-Degree of any node $v$ where $v \neq R$?
### Level 2: Competence (Application)
14. **The Routine Run:** Trace the path from Root to the deepest leaf in a given diagram and calculate the Height of the tree.
### Level 3: Mastery (The Crucible)
15. **The Disaster Drill:** You are building a file system tree. A user tries to create a "Shortcut" that points from a Sub-Folder back to its Parent Folder. Explain why this structure is no longer a "Tree" and what specific property (Cycles) is violated.

## [[Binary_and_M_ary_Tree_Properties]]
### Level 1: Understanding (The Basics)
16. **The Component Check:** What is the maximum number of children allowed for any node in a Binary Tree?
### Level 2: Competence (Application)
17. **The Sort:** Classify a tree where the Root has 3 children, and all other internal nodes have 3 children, as either a Full Binary Tree, Full 3-ary Tree, or neither.
### Level 3: Mastery (The Crucible)
18. **The Impostor:** You are shown a "Full Binary Tree" where one internal node has only 1 child. Explain why the label "Full" is incorrect for this structure.

# Part II: Unit Synthesis (The Final Boss)
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: The Network Architect
**The Setup:** You are designing a network topology for a secure communication system. The system must represent a hierarchy (Command HQ $\to$ Squads) but also allow for redundancy.
**The Constraints:**
1.  The core command structure must be a **Rooted Tree**.
2.  However, for backup purposes, you add extra directed edges so that if any one link fails, the graph remains at least **Weakly Connected**.
3.  You must calculate the link budget (Total Edges) using degrees.
**The Challenge:**
(a) Start with a **Full Binary Tree** of height 2 (Root + 2 levels). Draw the Adjacency Matrix.
(b) Calculate the $\sum \text{deg}^-(v)$ for this tree.
(c) Now, add a directed edge from a Leaf back to the Root. How does this change the **Connectivity** classification of the graph (Strong/Unilateral/Weak)?
(d) Does this new edge make the graph a "Strongly Connected" system? Why or why not?

```text
// Scenario: Synthesis Analysis
// Output:
// (a) Matrix size 7x7 (1 Root, 2 Children, 4 Grandchildren).
// (b) Sum of In-degrees = Total Edges = 6. (Tree with N=7 nodes has N-1 edges).
// (c) Adding Leaf->Root creates a cycle. Connectivity might become Strong depending on the specific path, or remain Unilateral if not all nodes are in the cycle.
// (d) Analysis: Since it was a full binary tree, Leaf->Root creates a cycle Root->...->Leaf->Root. However, can sibling leaves reach each other? No. So it is NOT Strongly Connected.
```