---
title: CC2131_5_Weighted_Graphs_And_Their_Applications_Possible_Questions
created_at: '2026-01-22T09:06:53Z'
last_modified: '2026-01-22T09:06:53Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 8d9db8d3-2428-476e-970a-cc4e47eb0702
type: Questions
course: Discrete_Mathematics
year: Year_II
semester: Semester_I
credits: 3
original_source: Lecture_Slides - 5_Weighted_Graphs_and_Their_Applications
aliases: []
unit: 5_Weighted_Graphs_And_Their_Applications
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[Weighted_Graphs]]
### Level 1: Understanding (The Basics)
1.  **The Neighbor Check:** List three distinct real-world scenarios where edge weights in a graph could represent 'capacity'.
### Level 2: Competence (Application)
2.  **The Sort:** Given a social network graph where edge weights represent the number of shared interests, categorize the following connections into 'Strong' (weight > 5) or 'Weak' (weight <= 5): (A,B)=7, (A,C)=3, (B,D)=6, (C,E)=2, (D,F)=9.
### Level 3: Mastery (The Impostor)
3.  **The Impostor:** You are presented with a graph representing flight routes between cities, where edges are colored (red for direct, blue for connecting flights). A colleague argues this is a weighted graph because the colors add 'value' to the connections. Explain why this is a 'False Friend' and not a true weighted graph, referring to the fundamental definition of weights.

## [[Minimal_Spanning_Trees]]
### Level 1: Understanding (The Basics)
4.  **The Variable ID:** In the formula $w(T) = \sum_{(u,v)\in T} w(u, v)$ for the weight of a spanning tree, what do $T$ and $w(u,v)$ physically represent in the context of connecting towns with roads?
### Level 2: Competence (Application)
5.  **The Standard Solver:** A set of 6 servers needs to be connected with network cables. The costs to connect each pair of servers are given. Calculate the minimum total cost to ensure all servers are connected, forming a spanning tree with the following edge costs: (S1,S2)=10, (S1,S3)=5, (S2,S3)=12, (S2,S4)=15, (S3,S4)=8, (S3,S5)=11, (S4,S5)=9, (S4,S6)=7, (S5,S6)=14.
### Level 3: Mastery (The Impossible Case)
6.  **The Impossible Case:** Consider a scenario where all edge weights in a connected, undirected graph are identical and positive. If a unique minimal spanning tree is required, what challenge does this scenario present to the 'minimum weight' criteria, and how would this ambiguity be typically resolved?

## Kruskals_Algorithm
### Level 1: Understanding (The Basics)
7.  **The Tool Check:** What is the primary data structure or concept that Kruskal's algorithm prioritizes when selecting edges to build an MST?
### Level 2: Competence (Application)
8.  **The Routine Run:** Outline the precise sequence of steps Kruskal's algorithm would take to find an MST for a graph, assuming you have already been given a sorted list of all edges by weight.
### Level 3: Mastery (The Disaster Drill)
9.  **The Disaster Drill:** During the execution of Kruskal's algorithm, a network administrator accidentally merges two distinct components by adding an edge that forms a cycle. Describe the exact step in the algorithm where this error would be detected and how the algorithm is designed to recover from it.

## Prims_Algorithm
### Level 1: Understanding (The Basics)
10. **The Tool Check:** What initial element does Prim's algorithm always start with to begin constructing an MST?
### Level 2: Competence (Application)
11. **The Routine Run:** Describe the iterative process by which Prim's algorithm expands its growing MST from a single starting vertex until all vertices are included.
### Level 3: Mastery (The Disaster Drill)
12. **The Disaster Drill:** If Prim's algorithm were being run on a large power grid, and an external event (e.g., a fallen tree) suddenly increased the weight of an edge that had already been permanently labeled, how would this affect the algorithm's current state and its ability to guarantee an optimal MST?

## [[Shortest_Path_Problem]]
### Level 1: Understanding (The Basics)
13. **The Variable ID:** In the context of a package delivery network, if $w_{i,j}$ represents the delivery time between point $i$ and point $j$, what does the sum $w_{1,2} + w_{2,3} + \dots + w_{k-1,k}$ signify for the shortest path problem?
### Level 2: Competence (Application)
14. **The Standard Solver:** A delivery driver needs to find the quickest route from their depot (start node) to a specific customer's house (end node) through a city with varying traffic conditions. Given a weighted graph representing the city's streets and travel times as weights, formulate the objective function that the driver needs to minimize.
### Level 3: Mastery (The Impossible Case)
15. **The Impossible Case:** Explain why a graph containing a negative-weight cycle poses a fundamental challenge to finding a "shortest path" in certain scenarios, particularly if the path is allowed to revisit vertices. What specific concept of a "shortest path" becomes ill-defined in such a graph?

## Dijkstras_Algorithm
### Level 1: Understanding (The Basics)
16. **The Tool Check:** Dijkstra's algorithm solves the single-source shortest path problem but has a critical constraint regarding the types of edge weights it can handle. What is this constraint?
### Level 2: Competence (Application)
17. **The Routine Run:** Describe the concept of "permanent labels" and "temporary labels" in Dijkstra's algorithm, explaining how they are updated and finalized as the algorithm progresses.
### Level 3: Mastery (The Disaster Drill)
18. **The Disaster Drill:** A navigation system using Dijkstra's algorithm for shortest routes encounters an unexpected, temporary road closure (effectively an edge with infinite weight) *after* it has already assigned a permanent label to a vertex that could have reached the destination via that now-closed road. How would the algorithm's subsequent steps be affected, and would it still find the correct shortest path, even if longer than initially anticipated?

## [[Bellman_Ford_Algorithm]]
### Level 1: Understanding (The Basics)
19. **The Tool Check:** What crucial type of edge weight can Bellman-Ford algorithm handle that Dijkstra's algorithm cannot, making it suitable for a wider range of graph problems?
### Level 2: Competence (Application)
20. **The Routine Run:** Outline the core iterative relaxation step that Bellman-Ford algorithm performs to gradually discover shorter paths within a graph.
### Level 3: Mastery (The Disaster Drill)
21. **The Disaster Drill:** An autonomous delivery drone uses Bellman-Ford to plan routes. If a malfunction introduces a negative-weight cycle into the route map (representing a path where energy is gained rather than lost), how would the Bellman-Ford algorithm detect this issue, and what would be the implication for the drone's route planning?

## [[Critical_Path_Problem]]
### Level 1: Understanding (The Basics)
22. **The Tool Check:** **[NEEDS MANUAL INPUT]**: What is the primary objective of the Critical Path Problem in project management?
### Level 2: Competence (Application)
23. **The Routine Run:** **[NEEDS MANUAL INPUT]**: Given a sequence of project tasks with specified durations and dependencies, how would one typically identify the "critical path"?
### Level 3: Mastery (The Disaster Drill)
24. **The Disaster Drill:** **[NEEDS MANUAL INPUT]**: A project manager using the Critical Path Method finds that a critical task is experiencing delays. Explain why focusing resources on non-critical tasks would be an ineffective strategy in this scenario.

# Part II: Unit Synthesis (The Final Boss)
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: Network Upgrade Planning
**The Setup:** A telecommunications company needs to upgrade its network infrastructure in a remote region. The region consists of 10 towns, and direct fiber optic connections can be established between certain pairs of towns. Each potential connection has an associated installation cost and a maximum data transfer capacity. The company has two primary objectives:
1.  Ensure all 10 towns are connected to the network with the minimum possible total installation cost.
2.  After all towns are connected, identify the fastest possible data route from the main regional hub (Town A) to a critical data center (Town G), considering current network traffic (which impacts effective data transfer capacity).

**The Constraints:**
*   Installation costs are always positive.
*   Data transfer capacities are always positive.
*   The budget for the initial network rollout (Objective 1) is limited, but a separate budget exists for data routing optimization (Objective 2).

**The Challenge:**
(a) Which specific graph algorithm would you use to achieve Objective 1? Explain the rationale behind your choice, clearly defining what the nodes, edges, and weights would represent in your graph model for this objective.
(b) After the network is installed (all towns connected), which specific algorithm would you use to achieve Objective 2? Explain how this algorithm would be applied, ensuring you clarify how data transfer capacity would be incorporated into the "weights" for this second objective.
(c) Consider the scenario where, after the initial network rollout, a critical link (an edge) fails due to unforeseen circumstances. Describe how this failure would impact both the MST (from Objective 1) and the shortest path (from Objective 2), and what immediate re-calculation or adaptation would be necessary for both objectives.