/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Task,
  CalendarEvent,
  LearningRoadmap,
  Project,
  JobApplication,
  NoteFolder,
  Note,
  Goal,
  UserProfile,
} from '../types';

export const initialUserProfile: UserProfile = {
  name: 'Harsh Varshney',
  email: 'harshvarshney302@gmail.com',
  title: 'AI Engineer & Systems Builder',
  accentColor: 'emerald',
  dailyTargetTasks: 5,
  timezone: 'Asia/Kolkata (UTC+05:30)',
};

export const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Review Transformer Multi-Head Self-Attention derivations',
    description: 'Implement scaled dot-product attention in PyTorch from scratch with causal masking.',
    priority: 'urgent',
    category: 'study',
    status: 'in_progress',
    dueDate: '2026-10-23',
    dueTime: '14:30',
    estimatedMinutes: 60,
    recurring: 'none',
    tags: ['GenAI', 'PyTorch', 'Math'],
    linkedProjectId: 'proj-1',
    createdAt: '2026-10-22',
  },
  {
    id: 'task-2',
    title: 'Solve 3 Dynamic Programming problems on LeetCode',
    description: 'Focus on 2D DP and Longest Common Subsequence variants in C++20.',
    priority: 'high',
    category: 'study',
    status: 'todo',
    dueDate: '2026-10-23',
    dueTime: '17:00',
    estimatedMinutes: 90,
    recurring: 'daily',
    tags: ['DSA', 'C++', 'DP'],
    createdAt: '2026-10-22',
  },
  {
    id: 'task-3',
    title: 'Submit resume for Machine Learning Engineer role at Anthropic',
    description: 'Customize cover letter highlighting RAG architecture and LLM evaluation pipeline.',
    priority: 'urgent',
    category: 'career',
    status: 'todo',
    dueDate: '2026-10-23',
    dueTime: '19:00',
    estimatedMinutes: 45,
    recurring: 'none',
    tags: ['Applications', 'Resume'],
    createdAt: '2026-10-21',
  },
  {
    id: 'task-4',
    title: 'Configure AWS IAM least-privilege roles for production Lambda',
    description: 'Restrict Secrets Manager and DynamoDB table permissions with boundary policies.',
    priority: 'medium',
    category: 'work',
    status: 'completed',
    dueDate: '2026-10-23',
    dueTime: '11:00',
    estimatedMinutes: 40,
    recurring: 'none',
    tags: ['AWS', 'Cloud', 'DevOps'],
    completedAt: '2026-10-23T11:20:00Z',
    createdAt: '2026-10-20',
  },
  {
    id: 'task-5',
    title: 'Revise Linear Algebra: Eigenvalues & SVD for GATE DA',
    description: 'Practice 15 GATE previous year questions on Singular Value Decomposition & spectral theorem.',
    priority: 'high',
    category: 'study',
    status: 'todo',
    dueDate: '2026-10-24',
    dueTime: '16:00',
    estimatedMinutes: 120,
    recurring: 'weekly',
    tags: ['GATE-DA', 'Math', 'Linear-Algebra'],
    createdAt: '2026-10-21',
  },
  {
    id: 'task-6',
    title: 'Benchmark vector indexing latency (HNSW vs IVF-PQ) in Qdrant',
    description: 'Measure recall vs QPS on 1M 1536-dimensional embeddings.',
    priority: 'medium',
    category: 'work',
    status: 'in_progress',
    dueDate: '2026-10-25',
    dueTime: '18:00',
    estimatedMinutes: 120,
    recurring: 'none',
    tags: ['VectorDB', 'GenAI', 'Search'],
    linkedProjectId: 'proj-1',
    createdAt: '2026-10-22',
  },
  {
    id: 'task-7',
    title: 'Deploy personal website portfolio updates to Cloudflare Pages',
    description: 'Update project showcase links and write brief notes on recent system architecture wins.',
    priority: 'low',
    category: 'personal',
    status: 'in_review',
    dueDate: '2026-10-26',
    dueTime: '20:00',
    estimatedMinutes: 45,
    recurring: 'none',
    tags: ['Portfolio', 'Frontend'],
    linkedProjectId: 'proj-2',
    createdAt: '2026-10-22',
  },
];

export const initialCalendarEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Deep Work: Attention Mechanism & PyTorch Implementation',
    description: 'Block out zero distractions to code multi-head attention.',
    type: 'deep_work',
    startDate: '2026-10-23',
    startTime: '13:00',
    endDate: '2026-10-23',
    endTime: '15:00',
    color: 'emerald',
    linkedTaskId: 'task-1',
  },
  {
    id: 'event-2',
    title: 'GATE DA Mock Test Analysis Session',
    description: 'Analyze weak areas in Calculus and Probability distributions.',
    type: 'study' as any,
    startDate: '2026-10-23',
    startTime: '15:30',
    endDate: '2026-10-23',
    endTime: '16:45',
    color: 'indigo',
  },
  {
    id: 'event-3',
    title: 'System Design Interview with Snowflake',
    description: 'Technical round 2: Real-time distributed data stream ingestion.',
    type: 'interview',
    startDate: '2026-10-24',
    startTime: '14:00',
    endDate: '2026-10-24',
    endTime: '15:00',
    location: 'Google Meet',
    color: 'amber',
  },
  {
    id: 'event-4',
    title: 'AWS Certified Solutions Architect Study Hour',
    description: 'VPC Peering, Transit Gateway, and Direct Connect routing protocols.',
    type: 'deep_work',
    startDate: '2026-10-25',
    startTime: '10:00',
    endDate: '2026-10-25',
    endTime: '11:30',
    color: 'teal',
  },
  {
    id: 'event-5',
    title: 'Weekly Sprint Retrospective & Goals Review',
    description: 'Audit tasks completed, milestone velocity, and upcoming interviews.',
    type: 'event',
    startDate: '2026-10-26',
    startTime: '19:00',
    endDate: '2026-10-26',
    endTime: '19:45',
    color: 'purple',
  },
];

export const initialRoadmaps: LearningRoadmap[] = [
  {
    id: 'roadmap-gate-da',
    title: 'GATE DA 2027',
    shortCode: 'GATE-DA',
    badge: 'Exam Preparation',
    targetYear: '2027',
    summary: 'Comprehensive mastery of Data Science & Artificial Intelligence syllabus: Linear Algebra, Calculus, Probability, Machine Learning, and Database Management.',
    iconName: 'GraduationCap',
    colorAccent: 'indigo',
    modules: [
      {
        id: 'mod-gda-1',
        title: 'Linear Algebra & Vector Calculus',
        estimatedHours: 45,
        topics: [
          {
            id: 'top-gda-1-1',
            title: 'Matrices, Determinants & Vector Spaces',
            description: 'Basis, span, linear independence, rank-nullity theorem, null spaces.',
            completed: true,
            subtopics: [
              { id: 'sub-1', title: 'Vector spaces & subspaces definition', completed: true },
              { id: 'sub-2', title: 'Basis and dimension calculations', completed: true },
              { id: 'sub-3', title: 'Rank-nullity theorem proofs and applications', completed: true },
            ],
            resources: [
              { id: 'res-1', title: 'Gilbert Strang - Linear Algebra and Its Applications', type: 'book' },
              { id: 'res-2', title: 'MIT 18.06 Linear Algebra Lecture Notes', type: 'doc' },
            ],
            notes: 'Remember: Column rank always equals row rank. The dimension of the null space is n - rank(A).',
            practiceQuestions: [
              {
                id: 'pq-1',
                question: 'If A is a 4x5 matrix with rank 3, what is the dimension of the null space of A?',
                difficulty: 'Easy',
                answer: '2',
                explanation: 'By the rank-nullity theorem, rank(A) + nullity(A) = n (number of columns). Here n = 5 and rank = 3, so nullity(A) = 5 - 3 = 2.',
              },
            ],
          },
          {
            id: 'top-gda-1-2',
            title: 'Eigenvalues, Eigenvectors & SVD',
            description: 'Characteristic equation, diagonalization, symmetric matrices, Singular Value Decomposition.',
            completed: false,
            subtopics: [
              { id: 'sub-4', title: 'Eigenvalues and characteristic polynomial', completed: true },
              { id: 'sub-5', title: 'Spectral theorem for symmetric matrices', completed: true },
              { id: 'sub-6', title: 'SVD: U, Sigma, V transpose decomposition', completed: false },
            ],
            resources: [
              { id: 'res-3', title: 'Understanding SVD geometric intuition (3Blue1Brown)', type: 'video' },
            ],
            notes: 'Singular values are the square roots of the non-zero eigenvalues of A^T * A.',
            practiceQuestions: [
              {
                id: 'pq-2',
                question: 'For a real symmetric matrix, are all eigenvalues guaranteed to be real numbers?',
                difficulty: 'Easy',
                answer: 'Yes',
                explanation: 'By the Spectral Theorem, any real symmetric matrix has strictly real eigenvalues and an orthonormal basis of eigenvectors.',
              },
            ],
          },
        ],
      },
      {
        id: 'mod-gda-2',
        title: 'Probability & Mathematical Statistics',
        estimatedHours: 50,
        topics: [
          {
            id: 'top-gda-2-1',
            title: 'Conditional Probability & Bayes Theorem',
            description: 'Total probability rule, independence, Bayes theorem applications in ML classification.',
            completed: true,
            subtopics: [
              { id: 'sub-7', title: 'Conditional probability formulas', completed: true },
              { id: 'sub-8', title: 'Bayes Theorem derivation and inversion', completed: true },
            ],
            resources: [
              { id: 'res-4', title: 'Harvard Stat 110 Probability course notes', type: 'doc' },
            ],
          },
          {
            id: 'top-gda-2-2',
            title: 'Continuous Distributions & Central Limit Theorem',
            description: 'Normal, Exponential, Uniform distributions, expectation, covariance, CLT proof.',
            completed: false,
            subtopics: [
              { id: 'sub-9', title: 'Probability density function & CDF properties', completed: true },
              { id: 'sub-10', title: 'Joint distributions & Covariance matrix', completed: false },
              { id: 'sub-11', title: 'Central Limit Theorem formulation', completed: false },
            ],
            resources: [
              { id: 'res-5', title: 'Mathematical Statistics with Applications (Wackerly)', type: 'book' },
            ],
          },
        ],
      },
      {
        id: 'mod-gda-3',
        title: 'Machine Learning & Deep Learning Core',
        estimatedHours: 60,
        topics: [
          {
            id: 'top-gda-3-1',
            title: 'Supervised Learning Algorithms',
            description: 'Linear regression, ridge/lasso regularization, logistic regression, SVMs, decision trees.',
            completed: false,
            subtopics: [
              { id: 'sub-12', title: 'Gradient descent & Cost function optimization', completed: true },
              { id: 'sub-13', title: 'L1 vs L2 regularization geometric interpretation', completed: false },
              { id: 'sub-14', title: 'Support Vector Machine dual formulation', completed: false },
            ],
            resources: [
              { id: 'res-6', title: 'Elements of Statistical Learning (Hastie, Tibshirani)', type: 'book' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'roadmap-genai',
    title: 'Generative AI Engineering',
    shortCode: 'GEN-AI',
    badge: 'Applied AI',
    summary: 'Mastering modern Large Language Models: Transformer internals, advanced RAG architectures, parameter-efficient fine-tuning (LoRA), and autonomous agent frameworks.',
    iconName: 'Cpu',
    colorAccent: 'emerald',
    modules: [
      {
        id: 'mod-gai-1',
        title: 'Transformer Architecture & Mechanics',
        estimatedHours: 35,
        topics: [
          {
            id: 'top-gai-1-1',
            title: 'Attention Mechanisms & Positional Embeddings',
            description: 'Scaled Dot-Product Attention, RoPE (Rotary Position Embeddings), Multi-Query (MQA) & Grouped-Query Attention (GQA).',
            completed: true,
            subtopics: [
              { id: 'sub-gai-1', title: 'Attention Is All You Need paper deep dive', completed: true },
              { id: 'sub-gai-2', title: 'Rotary Position Embedding (RoPE) math', completed: true },
              { id: 'sub-gai-3', title: 'GQA KV cache memory footprint savings', completed: true },
            ],
            resources: [
              { id: 'res-gai-1', title: 'The Illustrated Transformer (Jay Alammar)', type: 'doc' },
              { id: 'res-gai-2', title: 'FlashAttention-2 paper analysis', type: 'paper' },
            ],
            notes: 'GQA groups multiple query heads to share key/value projections, reducing KV cache by factor of 8x.',
            practiceQuestions: [
              {
                id: 'pq-gai-1',
                question: 'Why does Multi-Query Attention (MQA) dramatically reduce inference latency compared to Multi-Head Attention (MHA)?',
                difficulty: 'Medium',
                answer: 'Because all query heads share a single Key and Value head, reducing the memory bandwidth required to load the KV-cache from GPU HBM.',
                explanation: 'Autoregressive generation is memory-bandwidth bound. Reducing KV-cache size lowers DRAM traffic significantly.',
              },
            ],
          },
        ],
      },
      {
        id: 'mod-gai-2',
        title: 'Advanced Retrieval-Augmented Generation (RAG)',
        estimatedHours: 40,
        topics: [
          {
            id: 'top-gai-2-1',
            title: 'Chunking Strategies & Hybrid Search',
            description: 'Semantic chunking, parent document retrieval, BM25 + dense vector hybrid search with reciprocal rank fusion (RRF).',
            completed: true,
            subtopics: [
              { id: 'sub-gai-4', title: 'Semantic splitters vs recursive text splitters', completed: true },
              { id: 'sub-gai-5', title: 'BM25 sparse ranking + HNSW dense vector hybrid search', completed: true },
              { id: 'sub-gai-6', title: 'Re-ranking with Cross-Encoders (Cohere / BGE)', completed: true },
            ],
            resources: [
              { id: 'res-gai-3', title: 'Pinecone / Qdrant Hybrid Search Guides', type: 'doc' },
            ],
          },
          {
            id: 'top-gai-2-2',
            title: 'RAG Evaluation & Triad Metrics',
            description: 'Context relevance, groundedness / faithfulness, answer relevance using Ragas and TruLens.',
            completed: false,
            subtopics: [
              { id: 'sub-gai-7', title: 'Ragas evaluation framework setup', completed: true },
              { id: 'sub-gai-8', title: 'Hallucination detection via NLI models', completed: false },
            ],
            resources: [
              { id: 'res-gai-4', title: 'Ragas Documentation and Benchmark Dataset', type: 'doc' },
            ],
          },
        ],
      },
      {
        id: 'mod-gai-3',
        title: 'Model Fine-Tuning & Quantization',
        estimatedHours: 35,
        topics: [
          {
            id: 'top-gai-3-1',
            title: 'LoRA, QLoRA & DPO Alignment',
            description: 'Low-Rank Adaptation rank r and alpha hyperparameter selection, 4-bit NormalFloat NF4 quantization, Direct Preference Optimization.',
            completed: false,
            subtopics: [
              { id: 'sub-gai-9', title: 'LoRA mathematical formulation: W0 + B * A', completed: true },
              { id: 'sub-gai-10', title: 'Double quantization and paged optimizers in QLoRA', completed: false },
              { id: 'sub-gai-11', title: 'DPO loss vs RLHF PPO rewards', completed: false },
            ],
            resources: [
              { id: 'res-gai-5', title: 'Tim Dettmers QLoRA Paper', type: 'paper' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'roadmap-dsa',
    title: 'DSA in C++',
    shortCode: 'DSA-CPP',
    badge: 'Algorithms',
    summary: 'High-performance Data Structures and Algorithms in modern C++20: STL internals, graph traversals, dynamic programming, and competitive problem solving.',
    iconName: 'Code2',
    colorAccent: 'teal',
    modules: [
      {
        id: 'mod-dsa-1',
        title: 'Modern C++ Foundations & Complexity',
        estimatedHours: 25,
        topics: [
          {
            id: 'top-dsa-1-1',
            title: 'STL Containers & Memory Management',
            description: 'std::vector amortization, std::deque block structure, custom hashers for unordered_map, smart pointers.',
            completed: true,
            subtopics: [
              { id: 'sub-dsa-1', title: 'std::vector capacity vs size & exponential reallocation', completed: true },
              { id: 'sub-dsa-2', title: 'Custom hash functions with boost::hash_combine', completed: true },
            ],
            resources: [
              { id: 'res-dsa-1', title: 'Effective Modern C++ by Scott Meyers', type: 'book' },
            ],
          },
        ],
      },
      {
        id: 'mod-dsa-2',
        title: 'Trees, Graphs & Disjoint Set Union',
        estimatedHours: 45,
        topics: [
          {
            id: 'top-dsa-2-1',
            title: 'Graph Shortest Paths & Minimum Spanning Trees',
            description: "Dijkstra's algorithm with priority_queue, Bellman-Ford, Kruskal's with path compression DSU.",
            completed: true,
            subtopics: [
              { id: 'sub-dsa-3', title: 'Disjoint Set Union with rank and path compression', completed: true },
              { id: 'sub-dsa-4', title: 'Dijkstra implementation using std::greater pair', completed: true },
              { id: 'sub-dsa-5', title: 'Topological Sort (Kahn Algorithm & DFS)', completed: true },
            ],
            resources: [
              { id: 'res-dsa-2', title: 'Competitive Programmer Handbook by Antti Laaksonen', type: 'book' },
            ],
            practiceQuestions: [
              {
                id: 'pq-dsa-1',
                question: 'What is the amortized time complexity of DSU operations with union-by-rank and path compression?',
                difficulty: 'Medium',
                answer: 'O(alpha(n))',
                explanation: 'Inverse Ackermann function alpha(n) grows so slowly that for any practical input size n < 10^80, alpha(n) <= 4, effectively O(1).',
              },
            ],
          },
        ],
      },
      {
        id: 'mod-dsa-3',
        title: 'Dynamic Programming & Combinatorics',
        estimatedHours: 50,
        topics: [
          {
            id: 'top-dsa-3-1',
            title: 'Multi-Dimensional & Tree DP',
            description: 'Knapsack variants, DP on trees, digit DP, bitmask state compression.',
            completed: false,
            subtopics: [
              { id: 'sub-dsa-6', title: '0/1 and Unbounded Knapsack space optimization', completed: true },
              { id: 'sub-dsa-7', title: 'Subtree diameter and rerooting tree DP', completed: false },
              { id: 'sub-dsa-8', title: 'Bitmask DP: Travelling Salesperson Problem in O(n^2 * 2^n)', completed: false },
            ],
            resources: [
              { id: 'res-dsa-3', title: 'Errichto Dynamic Programming Masterclass', type: 'video' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'roadmap-aws',
    title: 'AWS Fundamentals',
    shortCode: 'AWS-CLOUD',
    badge: 'Cloud Systems',
    summary: 'Architecting resilient, secure cloud systems: IAM policies, VPC networking, compute (EC2/Lambda), storage (S3/EBS), and databases (RDS/DynamoDB).',
    iconName: 'Cloud',
    colorAccent: 'amber',
    modules: [
      {
        id: 'mod-aws-1',
        title: 'Identity, Security & Networking',
        estimatedHours: 30,
        topics: [
          {
            id: 'top-aws-1-1',
            title: 'VPC Architecture & Subnets',
            description: 'CIDR blocks, public vs private subnets, NAT Gateways, Internet Gateways, Route Tables, and Security Groups vs NACLs.',
            completed: true,
            subtopics: [
              { id: 'sub-aws-1', title: 'Designing a multi-AZ VPC layout with public and private subnets', completed: true },
              { id: 'sub-aws-2', title: 'Stateful Security Groups vs Stateless NACLs comparison', completed: true },
              { id: 'sub-aws-3', title: 'VPC endpoints (Gateway vs Interface) for secure S3 access', completed: true },
            ],
            resources: [
              { id: 'res-aws-1', title: 'AWS Well-Architected Framework Whitepaper', type: 'doc' },
            ],
            practiceQuestions: [
              {
                id: 'pq-aws-1',
                question: 'Are AWS Security Groups stateful or stateless, and what does that imply for outbound response traffic?',
                difficulty: 'Easy',
                answer: 'Stateful',
                explanation: 'Security Groups are stateful: if you allow inbound traffic on a port, the outbound response traffic is automatically permitted regardless of outbound rules.',
              },
            ],
          },
        ],
      },
      {
        id: 'mod-aws-2',
        title: 'Serverless Compute & Event-Driven Systems',
        estimatedHours: 35,
        topics: [
          {
            id: 'top-aws-2-1',
            title: 'AWS Lambda, EventBridge & SQS',
            description: 'Cold starts, concurrency limits, provisioned concurrency, dead letter queues (DLQ), and fan-out architecture via SNS/SQS.',
            completed: false,
            subtopics: [
              { id: 'sub-aws-4', title: 'Lambda lifecycle and execution environments', completed: true },
              { id: 'sub-aws-5', title: 'SQS FIFO queues and deduplication IDs', completed: false },
              { id: 'sub-aws-6', title: 'EventBridge custom buses and rule filtering', completed: false },
            ],
            resources: [
              { id: 'res-aws-2', title: 'Serverless Land Patterns Collection', type: 'doc' },
            ],
          },
        ],
      },
    ],
  },
];

export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Agamotto RAG Knowledge Kernel',
    description: 'Autonomous multi-modal RAG engine featuring hybrid search (BM25 + Qdrant HNSW), semantic chunking, and verifiable source citations.',
    status: 'active',
    category: 'GenAI',
    deadline: '2026-11-15',
    progress: 75,
    tags: ['Python', 'FastAPI', 'Qdrant', 'Gemini-Flash', 'LangGraph'],
    milestones: [
      { id: 'm-1', title: 'Implement PDF parser and semantic boundary chunker', dueDate: '2026-10-10', completed: true },
      { id: 'm-2', title: 'Integrate hybrid Qdrant + BM25 reciprocal rank fusion', dueDate: '2026-10-18', completed: true },
      { id: 'm-3', title: 'Add cross-encoder reranker and faithfulness evaluation benchmark', dueDate: '2026-10-28', completed: false },
      { id: 'm-4', title: 'Dockerize and deploy to AWS ECS Fargate', dueDate: '2026-11-15', completed: false },
    ],
    isDemoData: true,
    repoUrl: 'https://github.com/harshvarshney/rag-knowledge-kernel',
    createdAt: '2026-10-01',
  },
  {
    id: 'proj-2',
    name: 'Personal Engineering Portfolio',
    description: 'High-performance portfolio highlighting research papers, interactive system demos, and engineering writing with dark aesthetic polish.',
    status: 'in_review',
    category: 'Full-Stack',
    deadline: '2026-10-30',
    progress: 90,
    tags: ['React', 'TypeScript', 'TailwindCSS', 'Cloudflare Pages'],
    milestones: [
      { id: 'm-5', title: 'Design system tokens and responsive layouts', dueDate: '2026-10-12', completed: true },
      { id: 'm-6', title: 'Build interactive project showcase with live previews', dueDate: '2026-10-20', completed: true },
      { id: 'm-7', title: 'Lighthouse 100/100 performance and accessibility audit', dueDate: '2026-10-29', completed: false },
    ],
    isDemoData: true,
    repoUrl: 'https://github.com/harshvarshney/portfolio-v3',
    liveUrl: 'https://harshvarshney.dev',
    createdAt: '2026-10-05',
  },
  {
    id: 'proj-3',
    name: 'Eye of Agamotto Personal OS',
    description: 'Personal productivity & intelligence workspace uniting tasks, calendar, roadmaps, career tracker, and Gemini assistant.',
    status: 'active',
    category: 'Full-Stack',
    deadline: '2026-11-30',
    progress: 80,
    tags: ['React', 'TypeScript', 'Tailwind', 'Firebase', 'Gemini API'],
    milestones: [
      { id: 'm-8', title: 'Core UI layout, navigation, and state models', dueDate: '2026-10-23', completed: true },
      { id: 'm-9', title: 'Interactive roadmap progress calculation and note linking', dueDate: '2026-10-25', completed: true },
      { id: 'm-10', title: 'Full-stack Firestore persistence & Auth integration', dueDate: '2026-11-10', completed: false },
      { id: 'm-11', title: 'Server-side Gemini assistant agents', dueDate: '2026-11-25', completed: false },
    ],
    isDemoData: true,
    repoUrl: 'https://github.com/harshvarshney/eye-of-agamotto',
    createdAt: '2026-10-15',
  },
];

export const initialJobApplications: JobApplication[] = [
  {
    id: 'job-1',
    company: 'Anthropic',
    role: 'Member of Technical Staff - Machine Learning',
    location: 'San Francisco, CA (Remote / Hybrid)',
    applicationDate: '2026-10-23',
    status: 'applied',
    nextStep: 'Awaiting recruiter screen response',
    followUpDate: '2026-10-30',
    salaryRange: '$190k - $250k + Equity',
    notes: 'Submitted resume tailored with transformer evaluation and safety steerability experience.',
    link: 'https://anthropic.com/careers',
  },
  {
    id: 'job-2',
    company: 'Snowflake',
    role: 'Software Engineer - Distributed AI Systems',
    location: 'Bellevue, WA / Remote',
    applicationDate: '2026-10-12',
    status: 'interviewing',
    nextStep: 'Technical Round 2: Real-time Distributed Stream Processing',
    followUpDate: '2026-10-24',
    salaryRange: '$175k - $220k + Equity',
    notes: 'Passed Round 1 coding challenge (Hard DP + Trie problem). Reviewing Paxos/Raft consensus for Round 2.',
    contactPerson: 'David Chen (Engineering Manager)',
  },
  {
    id: 'job-3',
    company: 'Cohere',
    role: 'Applied LLM Solutions Engineer',
    location: 'Toronto, ON (Remote)',
    applicationDate: '2026-10-05',
    status: 'interviewing',
    nextStep: 'System Architecture Presentation with Staff AI Engineer',
    followUpDate: '2026-10-27',
    salaryRange: '$165k - $210k CAD',
    notes: 'Preparing deck on enterprise RAG grounding with Command-R+ model.',
  },
  {
    id: 'job-4',
    company: 'Weights & Biases',
    role: 'AI Developer Advocate & Systems Engineer',
    location: 'San Francisco, CA',
    applicationDate: '2026-09-28',
    status: 'offered',
    nextStep: 'Offer letter review & compensation negotiation',
    followUpDate: '2026-10-26',
    salaryRange: '$180k + Equity + $20k sign-on',
    notes: 'Received written offer. Evaluating team alignment and equity vesting schedule.',
  },
  {
    id: 'job-5',
    company: 'Scale AI',
    role: 'Generative AI Research Engineer',
    location: 'San Francisco, CA',
    applicationDate: '2026-09-15',
    status: 'bookmarked',
    nextStep: 'Reach out to recruiter on LinkedIn for referral',
    followUpDate: '2026-10-25',
    salaryRange: '$185k - $240k',
    notes: 'Targeting the RLHF evaluation foundation model team.',
  },
];

export const initialNoteFolders: NoteFolder[] = [
  { id: 'folder-all', name: 'All Notes', color: 'slate', icon: 'Layers' },
  { id: 'folder-genai', name: 'GenAI & LLMs', color: 'emerald', icon: 'Cpu' },
  { id: 'folder-math', name: 'GATE DA Math', color: 'indigo', icon: 'GraduationCap' },
  { id: 'folder-sys', name: 'System Design', color: 'teal', icon: 'Server' },
  { id: 'folder-career', name: 'Career & Interviews', color: 'amber', icon: 'Briefcase' },
];

export const initialNotes: Note[] = [
  {
    id: 'note-1',
    folderId: 'folder-genai',
    title: 'KV-Cache Memory Math in Autoregressive LLM Inference',
    content: `# KV-Cache Memory Calculation Formula

For autoregressive generation with batch size $b$, sequence length $s$, number of layers $L$, and key/value dimension $d$:

$$Memory = 2 \\times b \\times s \\times L \\times (n_{kv} \\times d_{head}) \\times \\text{bytes\\_per\\_elem}$$

### Key Insights:
- In Standard Multi-Head Attention (MHA), $n_{kv} = n_{heads}$. For a 70B parameter model at 8k context, this requires over 20GB of GPU VRAM strictly for the KV cache per concurrent request.
- Grouped-Query Attention (GQA) groups query heads into $k$ groups, dividing memory footprint by $n_{heads} / k$ (typically 8x reduction).
- PagedAttention (vLLM) resolves memory fragmentation by allocating virtual blocks of 16-32 tokens similarly to OS virtual memory paging.`,
    tags: ['LLM', 'Inference', 'VRAM', 'Math'],
    isBookmarked: true,
    isPinned: true,
    updatedAt: '2026-10-22T18:30:00Z',
    createdAt: '2026-10-18T12:00:00Z',
    linkedEntity: {
      type: 'roadmap',
      id: 'roadmap-genai',
      title: 'Generative AI Engineering',
    },
  },
  {
    id: 'note-2',
    folderId: 'folder-math',
    title: 'Singular Value Decomposition (SVD) Matrix Geometry',
    content: `# Geometric Meaning of $A = U \\Sigma V^T$

Any linear transformation $A \\in \\mathbb{R}^{m \\times n}$ can be decomposed into:
1. An orthonormal rotation/reflection in the input space ($V^T$).
2. A scaling along orthogonal coordinate axes by singular values ($\\Sigma$).
3. An orthonormal rotation/reflection in the output space ($U$).

### Connection to Covariance & PCA:
- The right singular vectors $V$ are the eigenvectors of $A^T A$ (sample covariance matrix).
- The left singular vectors $U$ are the eigenvectors of $A A^T$.
- Singular values $\\sigma_i = \\sqrt{\\lambda_i(A^T A)}$.
- Best rank-$k$ approximation of $A$ is given by the Eckart-Young-Mirsky theorem:
  $$A_k = \\sum_{i=1}^k \\sigma_i u_i v_i^T$$`,
    tags: ['LinearAlgebra', 'SVD', 'GATE-DA', 'PCA'],
    isBookmarked: true,
    isPinned: false,
    updatedAt: '2026-10-21T15:20:00Z',
    createdAt: '2026-10-14T09:00:00Z',
    linkedEntity: {
      type: 'roadmap',
      id: 'roadmap-gate-da',
      title: 'GATE DA 2027',
    },
  },
  {
    id: 'note-3',
    folderId: 'folder-sys',
    title: 'Distributed Vector Database Indexing: HNSW vs IVF-PQ Trade-offs',
    content: `# Vector Index Architectures

### 1. Hierarchical Navigable Small World (HNSW)
- **Strengths**: Near 99% recall, fast query response under 5ms, dynamic incremental inserts.
- **Trade-offs**: Extremely memory hungry. Graph edges must reside in RAM; 1M vectors with 1536 dims typically requires 8-12 GB RAM.

### 2. Inverted File with Product Quantization (IVF-PQ)
- **Strengths**: Compresses vectors by 8x-16x. Millions of vectors fit easily in small memory footprints.
- **Trade-offs**: Lower recall (~85-92%), slower cold-start build time, needs re-clustering when centroid drift occurs.`,
    tags: ['VectorDB', 'HNSW', 'SystemDesign', 'Search'],
    isBookmarked: false,
    isPinned: false,
    updatedAt: '2026-10-20T11:45:00Z',
    createdAt: '2026-10-10T14:15:00Z',
    linkedEntity: {
      type: 'project',
      id: 'proj-1',
      title: 'Agamotto RAG Knowledge Kernel',
    },
  },
  {
    id: 'note-4',
    folderId: 'folder-career',
    title: 'Interview Debrief: Snowflake System Design Round 1',
    content: `# Interview Debrief

### Strengths Noted by Interviewer:
- Clear requirements gathering and clarifying throughput / read-to-write ratio ($100k$ events/sec peak).
- Partitioning strategy on primary tenant ID with secondary hashing to eliminate hot partitions.
- Clear trade-off analysis between Kafka log compaction vs cold tiered storage in S3 Parquet format.

### Points to Sharpen for Round 2:
- Deepen discussion on split-brain prevention and quorum leases in Raft.
- Explicitly calculate network bandwidth constraints at the NIC layer ($10 \\text{ Gbps}$ saturated at $1.25 \\text{ GB/sec}$).`,
    tags: ['Interviews', 'Snowflake', 'DistributedSystems'],
    isBookmarked: true,
    isPinned: false,
    updatedAt: '2026-10-19T20:10:00Z',
    createdAt: '2026-10-19T18:00:00Z',
    linkedEntity: {
      type: 'task',
      id: 'task-3',
      title: 'Submit resume for Machine Learning Engineer role at Anthropic',
    },
  },
];

export const initialGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Master GATE DA 2027 Syllabus & Secure Top 100 Rank',
    timeframe: 'annual',
    category: 'learning',
    dueDate: '2027-02-15',
    notes: 'Complete all 7 subject modules, solve 10 years of PYQs, and take 20 full-length test series.',
    keyResults: [
      { id: 'kr-1', title: 'Complete Linear Algebra & Calculus revision', completed: true, currentValue: 100, targetValue: 100, unit: '%' },
      { id: 'kr-2', title: 'Solve 500 Probability & Statistics practice problems', completed: false, currentValue: 240, targetValue: 500, unit: 'problems' },
      { id: 'kr-3', title: 'Score >= 80% on 10 full-length GATE DA mock tests', completed: false, currentValue: 4, targetValue: 10, unit: 'tests' },
    ],
  },
  {
    id: 'goal-2',
    title: 'Secure Senior / Lead AI Systems Engineer Offer',
    timeframe: 'quarterly',
    category: 'career',
    dueDate: '2026-12-31',
    notes: 'Targeting frontier labs (Anthropic, Snowflake, Cohere) with focus on high-throughput LLM serving and RAG systems.',
    keyResults: [
      { id: 'kr-4', title: 'Complete 4 on-site interview loops', completed: false, currentValue: 2, targetValue: 4, unit: 'loops' },
      { id: 'kr-5', title: 'Publish 2 technical deep dives on LLM serving optimization', completed: true, currentValue: 2, targetValue: 2, unit: 'articles' },
      { id: 'kr-6', title: 'Secure an offer exceeding $200k base package', completed: false, currentValue: 0, targetValue: 1, unit: 'offers' },
    ],
  },
  {
    id: 'goal-3',
    title: 'Solve 150 LeetCode Medium/Hard Problems in C++20',
    timeframe: 'quarterly',
    category: 'learning',
    dueDate: '2026-11-30',
    notes: 'Prioritize Graphs, Dynamic Programming, and Interval Scheduling.',
    keyResults: [
      { id: 'kr-7', title: 'Dynamic Programming category: 40 problems', completed: false, currentValue: 28, targetValue: 40, unit: 'problems' },
      { id: 'kr-8', title: 'Graph & Disjoint Set Union: 35 problems', completed: true, currentValue: 35, targetValue: 35, unit: 'problems' },
      { id: 'kr-9', title: 'Tree & Binary Search: 30 problems', completed: true, currentValue: 30, targetValue: 30, unit: 'problems' },
    ],
  },
];
