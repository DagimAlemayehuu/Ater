/**
 * Ater - Preconfigured Mock Data for Interactive Tour / Demo Simulator
 */

export const MOCK_ACADEMIC_DASHBOARD = {
  years: [
    { id: 'Year I', title: 'Year I', Status: '[[Completed]]', 'Academic Level': '[[Undergraduate]]', 'Current Year': false, Program: '[[Computer Science]]' },
    { id: 'Year II', title: 'Year II', Status: '[[Active]]', 'Academic Level': '[[Undergraduate]]', 'Current Year': true, Program: '[[Computer Science]]' },
    { id: 'Year III', title: 'Year III', Status: '[[Planned]]', 'Academic Level': '[[Undergraduate]]', 'Current Year': false, Program: '[[Computer Science]]' },
    { id: 'Year IV', title: 'Year IV', Status: '[[Planned]]', 'Academic Level': '[[Undergraduate]]', 'Current Year': false, Program: '[[Computer Science]]' }
  ],
  semesters: [
    { id: 'sem_3', title: 'Semester III', year: 'Year II', active: true, start_date: '2026-09-01', end_date: '2026-12-20', Status: '[[Active]]' }
  ],
  courses: [
    { id: 'cs_201', title: 'CS 201: Algorithms & Data Structures', semester: 'Semester III', code: 'CS-201', description: 'Analysis of algorithms, complexity classes, search structures, and graphs.', Credits: '4', Grade: 'A', Status: '[[Active]]' }
  ],
  units: [
    { id: 'unit_1', title: 'Unit 1: Searching & Complexity', course: 'CS 201: Algorithms & Data Structures', unit_number: '1' }
  ],
  study_sessions: [
    { 
      id: 'searching_complexity', 
      title: 'Unit 1: Searching & Complexity', 
      course: '[[CS 201: Algorithms & Data Structures]]', 
      status: '[[In Progress]]', 
      total_time: 7200, // 2 hours
      practice_score: 4, 
      practice_total: 5, 
      exam: '[[Midterm Exam 1]]'
    },
    { 
      id: 'graph_algorithms', 
      title: 'Unit 2: Graph Theory & BFS/DFS', 
      course: '[[CS 201: Algorithms & Data Structures]]', 
      status: '[[Active]]', 
      total_time: 3600, // 1 hour
      practice_score: 0, 
      practice_total: 0, 
      exam: '[[Midterm Exam 1]]'
    }
  ],
  assignments: [
    {
      id: 'assign_1',
      title: 'Problem Set 1: Midpoint Logarithmic Proofs',
      Course: '[[CS 201: Algorithms & Data Structures]]',
      Priority: '[[High]]',
      due_date: '2026-06-02',
      Status: '[[In Progress]]',
      done: false
    },
    {
      id: 'assign_2',
      title: 'Lab 1: Implementing Halving Structures',
      Course: '[[CS 201: Algorithms & Data Structures]]',
      Priority: '[[Medium]]',
      due_date: '2026-06-08',
      Status: '[[Not Started]]',
      done: false
    }
  ],
  exams: [
    {
      id: 'midterm_1',
      title: 'Midterm Exam 1',
      Course: '[[CS 201: Algorithms & Data Structures]]',
      Type: '[[Midterm]]',
      date: '2026-06-15',
      Status: '[[Upcoming]]',
      Confidence: '[[High]]'
    }
  ]
};

export const MOCK_HUBS = {
  hubs: [
    { id: 'cs_201_hub', name: 'CS 201: Algorithms & Data Structures', description: 'Core lecture hubs' }
  ]
};

export const MOCK_HUB_NOTES = {
  notes: [
    { path: 'Notes/Binary_Search.md', title: 'Binary_Search', read: false },
    { path: 'Notes/Time_Complexity.md', title: 'Time_Complexity', read: true }
  ]
};

export const MOCK_FILES = [
  { name: 'Notes', path: 'Notes', is_dir: true },
  { name: 'Binary_Search.md', path: 'Notes/Binary_Search.md', is_dir: false, size: 2150 },
  { name: 'Time_Complexity.md', path: 'Notes/Time_Complexity.md', is_dir: false, size: 1840 },
  { name: 'Inbox', path: 'Inbox', is_dir: true },
  { name: 'Algorithms_Syllabus.pdf', path: 'Inbox/Algorithms_Syllabus.pdf', is_dir: false, size: 1048576 }
];

export const MOCK_NOTE_BINARY_SEARCH = `---
title: Binary_Search
type: Atomic Note
course: CS 201: Algorithms & Data Structures
semester: Semester III
unit: "1"
hub: "[[CS_201_Algorithms_&_Data_Structures_Hub]]"
source: "[[Algorithms_Syllabus.pdf]]"
source_pages: [12]
mode: CS
prerequisites: ["[[Time_Complexity]]"]
read: false
generated: true
---

## Mental Model

Binary Search is like finding a name in a physical printed phonebook. Instead of turning page-by-page from the start, you split the book exactly in half, check if the alphabet of your target name is before or after the current page, throw away the useless half, and repeat. The book thickness divides by two at every step, allowing you to locate any record in seconds.

## Algorithmic Halving

Binary Search is an optimal search algorithm designed to find targets in sorted arrays. It operates by repeatedly dividing the search interval in half. Mechanical execution requires tracking three indices: [[Low]], [[High]], and [[Mid]]. By comparing the target value to the element at the midpoint, the search space is cut in half at every iteration. It yields logarithmic performance [[Logarithmic_Time]] while minimizing array comparisons.

## Logarithmic Convergence

The search domain is strictly bounded by index constraints, terminating when the target is discovered or when low exceeds high.

\`\`\`cpp
int binarySearch(int arr[], int size, int target) {
    int low = 0;
    int high = size - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}
\`\`\`

The midpoint calculation \`low + (high - low) / 2\` prevents integer overflow bugs that occur using \`(low + high) / 2\`.

---

## The Proving Grounds

\`\`\`interactive-quiz
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "difficulty": "L1",
    "question": "What is the worst-case time complexity of Binary Search on a sorted array of size N?",
    "options": [
      "O(1)",
      "O(log N)",
      "O(N)",
      "O(N log N)"
    ],
    "answer": "O(log N)",
    "explanation": "At each step, the search domain is halved. The total operations scale logarithmically, O(log N)."
  },
  {
    "id": "q2",
    "type": "multiple-choice",
    "difficulty": "L2",
    "question": "Why is 'low + (high - low) / 2' preferred over '(low + high) / 2' in binary search implementations?",
    "options": [
      "It executes faster on modern processors",
      "It prevents arithmetic overflow when low and high are very large",
      "It automatically handles empty arrays",
      "It forces the compiler to inline the function"
    ],
    "answer": "It prevents arithmetic overflow when low and high are very large",
    "explanation": "If low and high are close to the maximum integer value, adding them together overflows the integer limit. The subtraction-based formulation avoids this."
  },
  {
    "id": "q3",
    "type": "code-debug",
    "difficulty": "L3",
    "question": "Debug this broken binary search midpoint update logic which causes infinite loops when the target is missing.",
    "content": "while (low <= high) {\n    int mid = low + (high - low) / 2;\n    if (arr[mid] == target) return mid;\n    if (arr[mid] < target) low = mid; // BUG\n    else high = mid; // BUG\n}",
    "answer": "low = mid + 1; and high = mid - 1;",
    "explanation": "Without shifting indices past mid, the search bounds stagnate, creating an infinite loop when pointers converge."
  }
]
\`\`\`
`;

export const MOCK_NOTE_TIME_COMPLEXITY = `---
title: Time_Complexity
type: Atomic Note
course: CS 201: Algorithms & Data Structures
semester: Semester III
unit: "1"
hub: "[[CS_201_Algorithms_&_Data_Structures_Hub]]"
source: "[[Algorithms_Syllabus.pdf]]"
source_pages: [5, 6]
mode: CS
prerequisites: []
read: true
generated: true
---

## Mental Model

Time Complexity is like counting the cooking steps in a recipe based on the number of guests. A simple microwave step takes the same time regardless of guest count (Constant). Stirring a soup scales linearly (Linear). Cooking a custom steak for each guest while making side dishes that depend on the total group size scales quadratically (Quadratic).

## Algorithmic Scaling

Time Complexity measures how execution time scales as input size grows. We formalize this using Big O notation, which defines asymptotic bounds. Essential complexity benchmarks include [[Constant_Time]], [[Logarithmic_Time]], [[Linear_Time]], and [[Quadratic_Time]]. By studying scaling rates, developers can choose algorithms that remain stable under massive production payloads.

## Complexity Bounds

Big O represents the mathematical upper bound of growth, neglecting constant multipliers and lower-order terms.

| Class | Notation | Description |
|---|---|---|
| Constant | O(1) | Executes independent of input size |
| Logarithmic | O(log N) | Work halves at each step |
| Linear | O(N) | Scales directly with input size |
| Quadratic | O(N^2) | Nested loops over input |

We trace nested loop scaling to prove complexity boundaries.

---

## The Proving Grounds

\`\`\`interactive-quiz
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "difficulty": "L1",
    "question": "Which Big O notation represents an algorithm whose execution time doubles whenever input size doubles?",
    "options": [
      "O(1)",
      "O(log N)",
      "O(N)",
      "O(N^2)"
    ],
    "answer": "O(N)",
    "explanation": "Linear complexity, O(N), scales in direct proportion to input size growth."
  }
]
\`\`\`
`;

export const MOCK_STUDY_HISTORY = {
  sessions: [
    { date: '2026-05-25', duration: 1800, hubId: 'cs_201_hub', mode: 'focus' },
    { date: '2026-05-26', duration: 3000, hubId: 'cs_201_hub', mode: 'focus' }
  ],
  telemetry: [
    { notePath: 'Notes/Time_Complexity.md', durationSeconds: 240, timestamp: '2026-05-26T14:22:00Z' }
  ],
  practice: [
    { hubId: 'cs_201_hub', score: 3, total: 3, notePath: 'Notes/Binary_Search.md', date: '2026-05-27' }
  ]
};

export const MOCK_PRACTICE_ANALYTICS = {
  modalities: {
    'multiple-choice': { correct: 4, attempts: 5 },
    'code-debug': { correct: 1, attempts: 2 }
  },
  weakest_concepts: [
    { path: 'Notes/Binary_Search.md', score: 0.5, name: 'Binary Search (L3 trace updates)' }
  ]
};

export const MOCK_SRS_DUE = {
  due_cards: [
    {
      note_path: 'Notes/Binary_Search.md',
      title: 'Binary Search',
      difficulty: 0.3,
      interval: 1,
      repetitions: 2,
      last_reviewed: '2026-05-26T12:00:00Z'
    }
  ]
};

export const MOCK_SRS_CARDS = {
  cards: [
    { note_path: 'Notes/Binary_Search.md', title: 'Binary Search', interval: 1, ease_factor: 2.5 },
    { note_path: 'Notes/Time_Complexity.md', title: 'Time Complexity', interval: 4, ease_factor: 2.6 }
  ]
};

export const MOCK_QUEUE_STATUS = {
  status: 'idle',
  auto_process: false,
  current_file: null,
  current_batch: 0,
  total_batches: 0,
  last_action: 'Scaffold completed',
  processed_notes: [],
  planned_batches: [],
  pending_count: 0,
  pending_files: []
};

export const MOCK_ORACLE_RESPONSES: Record<string, string> = {
  "hello": "Hello! I am your Socratic AI Oracle. I have mapped your Distributed Systems curriculum. You have active study materials in **Fault Tolerance and Replication** (like Consensus, Raft, Vector Clocks, and CAP Theorem). How can I assist your learning today?",
  "consensus": "Consensus is how distributed systems agree on a single data value or state among multiple nodes. Why is consensus harder when network partitions can delay messages indefinitely?",
  "raft": "Raft is a consensus algorithm designed to be easy to understand. It elects a leader node which has sole responsibility for managing the replicated log. What happens if the leader fails?",
  "vector clock": "Vector clocks are used to capture causal relationships in distributed systems. Unlike logical clocks, they can detect concurrent updates. Why does linear time fail to order events in a partition?",
  "cap": "The CAP theorem states that a distributed data store can simultaneously provide at most two out of three guarantees: Consistency, Availability, and Partition Tolerance. When a partition occurs, why must you choose between linearizability and availability?",
  "binary search": "Binary Search is a highly efficient search method. It works by taking a sorted dataset and repeatedly dividing it in half. Why must the array be sorted before using it? Think about what happens if you try search a random phonebook by dividing it in half.",
  "time complexity": "Time Complexity refers to how an algorithm's execution time scales relative to input size (N). For instance, Binary Search is O(log N), while simple iteration is O(N). Which structure would you choose if N grew to a billion elements?",
  "default": "I've scanned the mock curriculum. Let's analyze the concepts in your Obsidian notes. Ask me about **Consensus** properties, **Raft leader election**, or the **CAP Theorem** tradeoffs."
};
