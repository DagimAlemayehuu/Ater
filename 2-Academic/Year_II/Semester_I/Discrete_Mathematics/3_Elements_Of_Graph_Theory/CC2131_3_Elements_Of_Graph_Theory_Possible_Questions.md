---
title: CC2131_3_Elements_Of_Graph_Theory_Possible_Questions
created_at: '2026-01-22T09:16:24Z'
last_modified: '2026-01-22T09:16:24Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 732dca9a-a869-43e3-999b-2b22d4bedfd0
type: Questions
course: Discrete_Mathematics
year: Year_II
semester: Semester_I
credits: 3
original_source: Lecture 3 - Elements_of_Graph_Theory
aliases: []
unit: 3_Elements_Of_Graph_Theory
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[Graph_Definitions]]
### Level 1: Understanding (The Basics)
1.  **The Fact Check:** What is the fundamental difference between a graph and a multigraph?
### Level 2: Competence (Application)
2.  **The Sort:** Given a list of graph examples (e.g., social network, city road map with one-way streets, family tree), categorize them as directed or undirected graphs and explain your reasoning.
### Level 3: Mastery (The Crucible)
3.  **The Impostor:** A friend shows you a diagram with points and lines and claims it's always a "simple graph." Identify a scenario where their claim would be incorrect based on graph definitions.

## [[Vertex_and_Edge_Properties]]
### Level 1: Understanding (The Basics)
4.  **The Fact Check:** Define what it means for two vertices to be "adjacent" and for two edges to be "incident."
### Level 2: Competence (Application)
5.  **The Sort:** Given a graph, list all pairs of adjacent vertices and all pairs of adjacent edges.
### Level 3: Mastery (The Crucible)
6.  **The Impostor:** Describe a situation where a vertex is incident to an edge, but the vertex and edge are not considered "adjacent" in typical graph theory context.

## [[Degree_of_a_Vertex]]
### Level 1: Understanding (The Basics)
7.  **The Variable ID:** In the context of a non-directed graph, how is the degree of a vertex defined when loops are present?
### Level 2: Competence (Application)
8.  **The Standard Solver:** Consider a graph with vertices A, B, C, D and edges (A,B), (A,C), (B,C), (C,D) and a loop at vertex A. Calculate the degree of each vertex.
### Level 3: Mastery (The Crucible)
9.  **The Impossible Case:** What happens to the minimum and maximum degrees of a graph if you add a new vertex that is connected to all existing vertices?

## [[Handshaking_Lemma]]
### Level 1: Understanding (The Basics)
10. **The Variable ID:** State the Handshaking Lemma using mathematical notation.
### Level 2: Competence (Application)
11. **The Standard Solver:** A graph has 5 vertices with degrees 2, 3, 3, 4, 2. Using the Handshaking Lemma, determine the total number of edges in this graph.
### Level 3: Mastery (The Crucible)
12. **The Impossible Case:** Can a simple graph have an odd number of vertices, where every vertex has an odd degree? Justify your answer using the Handshaking Lemma.

## [[Graph_Matrices]]
### Level 1: Understanding (The Basics)
13. **The Component Check:** Name two common types of matrices used to represent graphs.
### Level 2: Competence (Application)
14. **The Clean Build:** Describe a scenario where an adjacency matrix would be more useful than an incidence matrix, and vice-versa.
### Level 3: Mastery (The Crucible)
15. **The Broken System:** If you are given a matrix representation of a graph, what specific characteristics would immediately tell you if the graph contains loops or multiple edges, without needing to draw it?

## [[Adjacency_Matrix]]
### Level 1: Understanding (The Basics)
16. **The Component Check:** For an adjacency matrix `A = (aij)` of a graph `G` with `m` vertices, what does `aij = n` (where `n > 1`) signify?
### Level 2: Competence (Application)
17. **The Clean Build:** Construct the adjacency matrix for a complete graph with 4 vertices.
### Level 3: Mastery (The Crucible)
18. **The Broken System:** A developer generates an adjacency matrix for a simple graph, but the diagonal elements are not all zeros. What does this immediately tell you about their understanding or implementation?

## [[Incidence_Matrix]]
### Level 1: Understanding (The Basics)
19. **The Component Check:** In an incidence matrix `I = (bij)` for a graph `G` with vertices `v1, ..., vm` and edges `e1, ..., en`, what does `bij = 1` indicate?
### Level 2: Competence (Application)
20. **The Clean Build:** Create the incidence matrix for a graph with 3 vertices (A, B, C) and 2 edges (e1=(A,B), e2=(B,C)).
### Level 3: Mastery (The Crucible)
21. **The Broken System:** A bug in a graph visualization tool incorrectly draws a graph based on its incidence matrix. Upon inspection, you notice a column in the incidence matrix containing only a single '1'. What kind of graph element would this indicate is missing or misrepresented?

## [[Subgraph_Concepts]]
### Level 1: Understanding (The Basics)
22. **The Fact Check:** Define a subgraph `H` of a graph `G` in terms of their vertex and edge sets.
### Level 2: Competence (Application)
23. **The Sort:** Given a graph `G` and several potential subgraphs, identify which ones are proper subgraphs and which are spanning subgraphs.
### Level 3: Mastery (The Crucible)
24. **The Impostor:** A student claims that any collection of vertices and edges from a graph `G` forms a subgraph. Explain why this statement is technically incorrect and provide a counterexample.

## [[Complement_of_a_Graph]]
### Level 1: Understanding (The Basics)
25. **The Fact Check:** What is the relationship between the edges of a simple graph `G` and its complement `G`?
### Level 2: Competence (Application)
26. **The Sort:** Given a simple graph, draw its complement.
### Level 3: Mastery (The Crucible)
27. **The Impostor:** A graph `G` is self-complementary if `G` is isomorphic to `G`. Describe the characteristics of a simple graph that could potentially be self-complementary.

## [[Isomorphic_Graphs]]
### Level 1: Understanding (The Basics)
28. **The Fact Check:** What are the key criteria for two graphs `G` and `G*` to be considered isomorphic?
### Level 2: Competence (Application)
29. **The Sort:** Given two simple graphs, explain how you would use their adjacency matrices to determine if they are isomorphic.
### Level 3: Mastery (The Crucible)
30. **The Impostor:** Two graphs have the same number of vertices and edges, and the same degree sequence. Is this sufficient to guarantee they are isomorphic? If not, provide a counterexample.

# Part II: Unit Synthesis (The Final Boss)
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: Designing a Campus Network
**The Setup:** You are tasked with designing a new high-speed network for a university campus. The campus has several key buildings (e.g., Library, Computer_Science_Building, Dormitory_A, Administration, Cafeteria). You need to connect these buildings such that all can communicate, but you also want to optimize for different factors.
**The Constraints:**
*   You have a limited budget, so minimizing the total number of physical cable runs (edges) is critical.
*   Certain high-traffic buildings (e.g., Library, Computer_Science_Building) need robust, direct connections, minimizing "hops."
*   The network must be resilient; if any single cable fails, communication between at least some buildings should still be possible.
*   You must be able to visually represent the network layout for different stakeholders (e.g., IT department, management).
**The Challenge:**
(a) Design a network topology that uses the minimum number of connections while ensuring all buildings are connected. What graph theory concept does this solution exemplify?
(b) How would you ensure that a single cable failure doesn't completely isolate any building? Which graph property would you prioritize to measure this resilience?
(c) Later, the university asks you to implement a security protocol where no two directly connected buildings can run the exact same security software version due to compatibility issues. Which graph theory problem does this describe, and how would you represent the minimum software versions needed?
(d) Using a Mermaid diagram, illustrate a proposed network design for 5 buildings (Library, CS_Building, DormA, Admin, Cafeteria) that prioritizes resilience and clearly labels the connections.