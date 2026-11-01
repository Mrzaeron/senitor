INSERT INTO public.topics
  (name, slug, description, icon, difficulty, sort_order, is_published)
VALUES
  ('Programming Fundamentals', 'programming-fundamentals', 'Build the programming skills needed to read, reason about, and implement data structures and algorithms.', 'Code2', 'beginner', 1, TRUE),
  ('Time and Space Complexity', 'time-and-space-complexity', 'Learn to estimate how algorithms scale and make informed trade-offs between runtime and memory.', 'Clock', 'beginner', 2, TRUE),
  ('Arrays', 'arrays', 'Practice sequential data, range queries, in-place transformations, and common array problem patterns.', 'Layers', 'beginner', 3, TRUE),
  ('Strings', 'strings', 'Work with text as sequences and learn frequency, palindrome, matching, and hashing techniques.', 'BookOpen', 'beginner', 4, TRUE),
  ('Searching and Sorting', 'searching-and-sorting', 'Choose and implement search and ordering strategies, from binary search to comparison sorting.', 'Search', 'beginner', 5, TRUE),
  ('Hashing', 'hashing', 'Use hash maps and sets to build fast lookup, counting, grouping, and deduplication solutions.', 'Hash', 'intermediate', 6, TRUE),
  ('Two Pointers and Sliding Window', 'two-pointers-and-sliding-window', 'Solve sequence problems efficiently by coordinating pointers and maintaining a moving window.', 'Code2', 'intermediate', 7, TRUE),
  ('Linked Lists', 'linked-lists', 'Understand pointer-based sequences and practice safe traversal, mutation, reversal, and cycle detection.', 'GitBranch', 'beginner', 8, TRUE),
  ('Stacks and Queues', 'stacks-and-queues', 'Model ordered processing with stacks, queues, deques, and monotonic structures.', 'Layers', 'beginner', 9, TRUE),
  ('Recursion and Backtracking', 'recursion-and-backtracking', 'Break problems into smaller calls and systematically explore candidate solutions.', 'Code2', 'intermediate', 10, TRUE),
  ('Trees and Binary Search Trees', 'trees-and-binary-search-trees', 'Traverse hierarchical data and use binary search tree ordering to answer queries.', 'GitBranch', 'intermediate', 11, TRUE),
  ('Heaps and Priority Queues', 'heaps-and-priority-queues', 'Maintain efficient access to the smallest or largest item for scheduling and selection problems.', 'Layers', 'intermediate', 12, TRUE),
  ('Graphs', 'graphs', 'Model relationships and solve connectivity, traversal, shortest-path, and ordering problems.', 'Network', 'intermediate', 13, TRUE),
  ('Greedy Algorithms', 'greedy-algorithms', 'Recognize when locally optimal choices can produce a globally optimal solution.', 'TrendingUp', 'intermediate', 14, TRUE),
  ('Dynamic Programming', 'dynamic-programming', 'Structure overlapping subproblems into memoized or tabulated solutions.', 'Layers', 'advanced', 15, TRUE),
  ('Tries', 'tries', 'Store strings by shared prefixes to support efficient prefix lookup and dictionary operations.', 'GitBranch', 'intermediate', 16, TRUE),
  ('Bit Manipulation', 'bit-manipulation', 'Reason directly about binary representations and use bitwise operations for compact solutions.', 'Code2', 'intermediate', 17, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  difficulty = EXCLUDED.difficulty,
  sort_order = EXCLUDED.sort_order,
  is_published = EXCLUDED.is_published;

INSERT INTO public.subtopics
  (topic_id, name, slug, description, sort_order, estimated_minutes, is_published)
SELECT
  topics.id,
  seed.name,
  seed.slug,
  seed.description,
  seed.sort_order,
  seed.estimated_minutes,
  TRUE
FROM (VALUES
  ('programming-fundamentals', 'Variables and Data Types', 'variables-and-data-types', 'Represent values with variables and choose types that match the data being modeled.', 1, 25),
  ('programming-fundamentals', 'Input and Output', 'input-and-output', 'Read problem input carefully and format output predictably.', 2, 20),
  ('programming-fundamentals', 'Conditionals', 'conditionals', 'Use boolean expressions and branches to make decisions in an algorithm.', 3, 25),
  ('programming-fundamentals', 'Loops and Iteration', 'loops-and-iteration', 'Repeat work with loops and reason about loop state and termination.', 4, 30),
  ('programming-fundamentals', 'Functions and Scope', 'functions-and-scope', 'Decompose programs into reusable functions and understand variable scope.', 5, 30),
  ('programming-fundamentals', 'Debugging and Testing', 'debugging-and-testing', 'Use small examples, assertions, and systematic tracing to find errors.', 6, 25),
  ('time-and-space-complexity', 'Counting Operations', 'counting-operations', 'Estimate work by counting how often the important operations execute.', 1, 25),
  ('time-and-space-complexity', 'Big O, Omega, and Theta', 'asymptotic-notation', 'Describe upper, lower, and tight asymptotic growth bounds.', 2, 30),
  ('time-and-space-complexity', 'Analyzing Loops', 'analyzing-loops', 'Analyze single, nested, and dependent loops without overcounting.', 3, 35),
  ('time-and-space-complexity', 'Space Complexity', 'space-complexity', 'Account for auxiliary storage, input storage, and recursive call stacks.', 4, 30),
  ('time-and-space-complexity', 'Amortized Analysis', 'amortized-analysis', 'Understand why occasional expensive operations can still have low average cost.', 5, 30),
  ('arrays', 'Array Fundamentals', 'array-fundamentals', 'Understand indexed storage, bounds, and the cost of common array operations.', 1, 25),
  ('arrays', 'Array Traversal', 'array-traversal', 'Visit elements safely and maintain useful state during a scan.', 2, 25),
  ('arrays', 'Prefix Sum', 'prefix-sum', 'Precompute cumulative totals to answer range-sum queries efficiently.', 3, 35),
  ('arrays', 'Two Pointers', 'two-pointers', 'Coordinate indices to solve sorted-array and pair-search problems.', 4, 35),
  ('arrays', 'Sliding Window', 'sliding-window', 'Maintain information about a contiguous range as its endpoints move.', 5, 40),
  ('arrays', 'Kadane''s Algorithm', 'kadanes-algorithm', 'Find a maximum-sum contiguous subarray with a running best state.', 6, 30),
  ('arrays', 'Subarrays', 'subarrays', 'Distinguish contiguous subarrays from subsequences and enumerate ranges efficiently.', 7, 30),
  ('arrays', 'Matrix Problems', 'matrix-problems', 'Traverse, transform, and reason about two-dimensional arrays.', 8, 40),
  ('strings', 'String Fundamentals', 'string-fundamentals', 'Understand strings as sequences and account for indexing and immutability.', 1, 25),
  ('strings', 'String Traversal', 'string-traversal', 'Scan text while tracking positions, boundaries, and useful state.', 2, 25),
  ('strings', 'Character Frequency', 'character-frequency', 'Count characters with arrays or maps to compare and classify strings.', 3, 30),
  ('strings', 'Palindromes', 'palindromes', 'Check symmetric sequences and build palindrome-oriented solutions.', 4, 30),
  ('strings', 'Pattern Matching', 'pattern-matching', 'Search for a pattern in text and understand prefix-based matching ideas.', 5, 40),
  ('strings', 'String Hashing', 'string-hashing', 'Use rolling hashes to compare substrings while understanding collision risks.', 6, 40),
  ('searching-and-sorting', 'Linear Search', 'linear-search', 'Scan a collection when values are unsorted or the input is small.', 1, 20),
  ('searching-and-sorting', 'Binary Search Fundamentals', 'binary-search-fundamentals', 'Use a monotonic condition to repeatedly halve a search interval.', 2, 35),
  ('searching-and-sorting', 'Binary Search on Answers', 'binary-search-on-answers', 'Search a solution space when feasibility changes monotonically.', 3, 40),
  ('searching-and-sorting', 'Elementary Sorting', 'elementary-sorting', 'Compare selection, insertion, and bubble sort and understand their trade-offs.', 4, 30),
  ('searching-and-sorting', 'Merge Sort', 'merge-sort', 'Sort by dividing the input, sorting each half, and merging the results.', 5, 35),
  ('searching-and-sorting', 'Quick Sort', 'quick-sort', 'Partition around a pivot and analyze expected and worst-case behavior.', 6, 35),
  ('hashing', 'Hash Maps and Sets', 'hash-maps-and-sets', 'Choose maps and sets for fast average-case lookup and membership checks.', 1, 30),
  ('hashing', 'Frequency Counting', 'frequency-counting', 'Represent occurrence counts to compare, group, and summarize values.', 2, 30),
  ('hashing', 'Duplicate Detection', 'duplicate-detection', 'Detect repeated values using set membership and controlled memory use.', 3, 25),
  ('hashing', 'Grouping and Anagrams', 'grouping-and-anagrams', 'Build canonical keys to group equivalent items such as anagrams.', 4, 35),
  ('hashing', 'Hash Collisions', 'hash-collisions', 'Understand collisions, hash quality, and why hash-table performance is average-case.', 5, 30),
  ('two-pointers-and-sliding-window', 'Opposite-Direction Pointers', 'opposite-direction-pointers', 'Move pointers inward to exploit ordering or symmetric structure.', 1, 35),
  ('two-pointers-and-sliding-window', 'Same-Direction Pointers', 'same-direction-pointers', 'Use read and write positions to filter or compact sequences in place.', 2, 35),
  ('two-pointers-and-sliding-window', 'Fixed-Size Windows', 'fixed-size-windows', 'Maintain a rolling aggregate for windows of a known length.', 3, 30),
  ('two-pointers-and-sliding-window', 'Variable-Size Windows', 'variable-size-windows', 'Expand and shrink a range while maintaining a monotonic constraint.', 4, 40),
  ('two-pointers-and-sliding-window', 'Window Frequency Maps', 'window-frequency-maps', 'Track character or value counts as a window moves through a sequence.', 5, 40),
  ('two-pointers-and-sliding-window', 'Window Invariants', 'window-invariants', 'State and preserve the invariant that makes a window algorithm correct.', 6, 35),
  ('linked-lists', 'Node and List Representation', 'node-and-list-representation', 'Model a linked list as nodes connected by references.', 1, 25),
  ('linked-lists', 'Traversal and Search', 'traversal-and-search', 'Walk nodes safely and handle empty lists and end-of-list boundaries.', 2, 25),
  ('linked-lists', 'Insertion and Deletion', 'insertion-and-deletion', 'Update links correctly when inserting or removing nodes.', 3, 35),
  ('linked-lists', 'Reversing a List', 'reversing-a-list', 'Reverse links iteratively or recursively while retaining access to the remainder.', 4, 35),
  ('linked-lists', 'Fast and Slow Pointers', 'fast-and-slow-pointers', 'Use pointers moving at different speeds to find middle positions and cycles.', 5, 35),
  ('linked-lists', 'Cycle Detection', 'cycle-detection', 'Detect cycles and locate their entry point with constant extra space.', 6, 35),
  ('stacks-and-queues', 'Stack Fundamentals', 'stack-fundamentals', 'Use last-in-first-out ordering for nested and deferred work.', 1, 25),
  ('stacks-and-queues', 'Queue and Deque Fundamentals', 'queue-and-deque-fundamentals', 'Process items in arrival order or access both ends with a deque.', 2, 30),
  ('stacks-and-queues', 'Monotonic Stacks', 'monotonic-stacks', 'Maintain a monotonic stack for next-greater and span-style problems.', 3, 40),
  ('stacks-and-queues', 'Monotonic Queues', 'monotonic-queues', 'Maintain candidate extrema in a window with a deque.', 4, 40),
  ('stacks-and-queues', 'Circular Queues', 'circular-queues', 'Reuse fixed-capacity storage with modular index arithmetic.', 5, 30),
  ('stacks-and-queues', 'Expression Parsing', 'expression-parsing', 'Use stacks to process delimiters, operators, and nested expressions.', 6, 40),
  ('recursion-and-backtracking', 'Call Stack and Base Cases', 'call-stack-and-base-cases', 'Define terminating base cases and trace recursive calls and returns.', 1, 30),
  ('recursion-and-backtracking', 'Recursive Decomposition', 'recursive-decomposition', 'Reduce a problem to smaller instances with a clear recurrence.', 2, 35),
  ('recursion-and-backtracking', 'Subsets and Combinations', 'subsets-and-combinations', 'Explore include-or-exclude choices to generate subsets and combinations.', 3, 40),
  ('recursion-and-backtracking', 'Permutations', 'permutations', 'Generate order-sensitive arrangements while tracking used choices.', 4, 40),
  ('recursion-and-backtracking', 'Constraint Search', 'constraint-search', 'Build candidates incrementally and reject invalid partial solutions.', 5, 45),
  ('recursion-and-backtracking', 'Pruning and State Restoration', 'pruning-and-state-restoration', 'Reduce search and correctly undo state when returning from recursion.', 6, 40),
  ('trees-and-binary-search-trees', 'Tree Representation', 'tree-representation', 'Model rooted trees, child links, depth, and height.', 1, 25),
  ('trees-and-binary-search-trees', 'Depth-First Traversals', 'depth-first-traversals', 'Use preorder, inorder, and postorder traversals for tree problems.', 2, 35),
  ('trees-and-binary-search-trees', 'Breadth-First Traversal', 'breadth-first-traversal', 'Process nodes level by level using a queue.', 3, 35),
  ('trees-and-binary-search-trees', 'Tree Recursion Patterns', 'tree-recursion-patterns', 'Combine child results to solve structural tree problems.', 4, 40),
  ('trees-and-binary-search-trees', 'Binary Search Tree Invariants', 'binary-search-tree-invariants', 'Use the ordering invariant to search and validate a binary search tree.', 5, 35),
  ('trees-and-binary-search-trees', 'BST Insertion and Deletion', 'bst-insertion-and-deletion', 'Update a search tree while preserving its key ordering.', 6, 45),
  ('trees-and-binary-search-trees', 'Lowest Common Ancestor', 'lowest-common-ancestor', 'Find the deepest shared ancestor of two nodes.', 7, 35),
  ('heaps-and-priority-queues', 'Heap Properties', 'heap-properties', 'Understand complete binary trees and the min-heap and max-heap invariants.', 1, 30),
  ('heaps-and-priority-queues', 'Priority Queue Operations', 'priority-queue-operations', 'Insert values and extract the next highest-priority item efficiently.', 2, 30),
  ('heaps-and-priority-queues', 'Top-K Problems', 'top-k-problems', 'Select the largest or smallest k values with a bounded heap.', 3, 35),
  ('heaps-and-priority-queues', 'Heap Construction', 'heap-construction', 'Build a heap efficiently and understand bottom-up heapification.', 4, 30),
  ('heaps-and-priority-queues', 'Two-Heap Patterns', 'two-heap-patterns', 'Maintain lower and upper halves of a changing data stream.', 5, 40),
  ('graphs', 'Graph Representations', 'graph-representations', 'Represent directed, undirected, weighted, and unweighted graphs.', 1, 30),
  ('graphs', 'Breadth-First Search', 'breadth-first-search', 'Explore graphs by distance layers and find shortest paths in unweighted graphs.', 2, 35),
  ('graphs', 'Depth-First Search', 'depth-first-search', 'Explore connected structure recursively or with an explicit stack.', 3, 35),
  ('graphs', 'Connected Components and Cycles', 'connected-components-and-cycles', 'Identify components and detect cycles in common graph types.', 4, 40),
  ('graphs', 'Topological Sorting', 'topological-sorting', 'Order directed acyclic graph vertices by dependency.', 5, 40),
  ('graphs', 'Shortest Paths', 'shortest-paths', 'Select BFS, Dijkstra, or Bellman-Ford based on edge weights and constraints.', 6, 50),
  ('graphs', 'Minimum Spanning Trees', 'minimum-spanning-trees', 'Connect all vertices at minimum total weight using Kruskal or Prim.', 7, 45),
  ('greedy-algorithms', 'Recognizing Greedy Choices', 'recognizing-greedy-choices', 'Form a local-choice strategy and identify what must be proven for correctness.', 1, 35),
  ('greedy-algorithms', 'Intervals and Scheduling', 'intervals-and-scheduling', 'Sort intervals to select compatible activities or minimize resources.', 2, 40),
  ('greedy-algorithms', 'Greedy Exchange Arguments', 'greedy-exchange-arguments', 'Prove a greedy solution by exchanging choices with an optimal solution.', 3, 40),
  ('greedy-algorithms', 'Huffman Coding', 'huffman-coding', 'Build an optimal prefix code by repeatedly combining the lightest trees.', 4, 35),
  ('greedy-algorithms', 'Greedy with Heaps', 'greedy-with-heaps', 'Combine a greedy rule with a priority queue for changing candidates.', 5, 40),
  ('dynamic-programming', 'Memoization', 'memoization', 'Cache recursive subproblem results to avoid repeated computation.', 1, 35),
  ('dynamic-programming', 'Tabulation', 'tabulation', 'Compute subproblems in dependency order using an iterative table.', 2, 40),
  ('dynamic-programming', 'State and Recurrence Design', 'state-and-recurrence-design', 'Define what each DP state means and derive transitions from smaller states.', 3, 45),
  ('dynamic-programming', 'One-Dimensional DP', 'one-dimensional-dp', 'Model sequence decisions with a compact one-dimensional state.', 4, 40),
  ('dynamic-programming', 'Grid and Two-Dimensional DP', 'grid-and-two-dimensional-dp', 'Solve path and pairwise sequence problems with a two-dimensional state.', 5, 45),
  ('dynamic-programming', 'Knapsack Patterns', 'knapsack-patterns', 'Distinguish 0/1 and unbounded choices and optimize capacity states.', 6, 45),
  ('dynamic-programming', 'Reconstructing a Solution', 'reconstructing-a-solution', 'Track choices or inspect DP states to recover an optimal solution.', 7, 40),
  ('tries', 'Trie Representation', 'trie-representation', 'Represent prefixes as shared paths through a character tree.', 1, 30),
  ('tries', 'Insertion and Exact Search', 'insertion-and-exact-search', 'Insert words and determine whether a complete word exists.', 2, 30),
  ('tries', 'Prefix Search', 'prefix-search', 'Find words and counts that share a requested prefix.', 3, 30),
  ('tries', 'Trie Variants', 'trie-variants', 'Adapt tries for bitwise keys, wildcard matching, and compressed paths.', 4, 40),
  ('bit-manipulation', 'Binary Representation', 'binary-representation', 'Convert between decimal values and their binary representation.', 1, 25),
  ('bit-manipulation', 'Bitwise Operators', 'bitwise-operators', 'Apply AND, OR, XOR, and complement to individual bits.', 2, 30),
  ('bit-manipulation', 'Shifts and Masks', 'shifts-and-masks', 'Inspect, set, clear, and toggle bits with shifts and masks.', 3, 35),
  ('bit-manipulation', 'Counting Set Bits', 'counting-set-bits', 'Count one-bits with simple scans and efficient bit-clearing methods.', 4, 30),
  ('bit-manipulation', 'XOR Patterns', 'xor-patterns', 'Use XOR cancellation and parity properties to simplify problems.', 5, 35)
) AS seed(topic_slug, name, slug, description, sort_order, estimated_minutes)
JOIN public.topics ON topics.slug = seed.topic_slug
ON CONFLICT (topic_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  estimated_minutes = EXCLUDED.estimated_minutes,
  is_published = EXCLUDED.is_published;

INSERT INTO public.lessons
  (subtopic_id, title, slug, content, estimated_minutes, sort_order, is_published)
SELECT
  subtopics.id,
  seed.title,
  seed.slug,
  seed.content,
  seed.estimated_minutes,
  seed.sort_order,
  TRUE
FROM (VALUES
  ('programming-fundamentals', 'variables-and-data-types', 'Representing Values with Variables', 'representing-values-with-variables', $lesson$
## What is a variable?

A variable is a named place to store a value that an algorithm will use. Give each variable a name that describes its role: `count` is clearer than `x` when it stores a number of items.

## Choose a suitable type

The type determines which values can be represented and which operations make sense. Use an integer for counts and indices, a boolean for a condition, and a string for text. In languages with fixed-width integers, also consider the largest possible input and intermediate result.

## Trace state changes

When debugging an algorithm, write down the value of each important variable after every update. This makes off-by-one errors and incorrect assumptions easier to spot.

```text
total = 0
for each value:
    total = total + value
```

Here, `total` is the running sum. Its meaning stays consistent throughout the loop: it equals the sum of all values processed so far.
$lesson$, 8, 1),
  ('programming-fundamentals', 'loops-and-iteration', 'Iteration and Loop Invariants', 'iteration-and-loop-invariants', $lesson$
## Iterating over a collection

A loop repeats a block of work. For an array of length `n`, a common traversal visits indices from `0` through `n - 1`. Check the loop condition carefully: using `i <= n` would access one position beyond the end.

## State an invariant

A loop invariant is a statement that should remain true at the start of every iteration. For a running sum, an invariant might be: “`total` contains the sum of all elements before index `i`.”

To use an invariant, verify three things:

- It is true before the first iteration.
- One iteration preserves it.
- When the loop stops, it implies the desired result.

This habit turns loop tracing into a correctness argument rather than guesswork.
$lesson$, 10, 1),
  ('time-and-space-complexity', 'asymptotic-notation', 'A Practical Introduction to Big O', 'a-practical-introduction-to-big-o', $lesson$
## Growth matters more than exact time

Big O describes how an algorithm's resource use grows as input size `n` increases. It ignores constant factors and lower-order terms, so `3n + 10` is `O(n)`, while `n² + 4n` is `O(n²)`.

Common growth rates, from slower to faster, include:

- `O(1)`: constant work
- `O(log n)`: repeatedly reduce the search space
- `O(n)`: scan the input once
- `O(n log n)`: common efficient comparison sorting
- `O(n²)`: compare many pairs or use two full nested loops

## State your assumptions

Complexity depends on the operations and input model. A hash-map lookup is usually expected `O(1)`, but that is not a worst-case guarantee. Explain the assumption when it matters.
$lesson$, 10, 1),
  ('time-and-space-complexity', 'analyzing-loops', 'Analyzing Nested Loops', 'analyzing-nested-loops', $lesson$
## Independent loop ranges

If one loop visits `n` items and a nested loop also visits `n` items for every outer iteration, the body runs `n × n` times. The resulting time complexity is `O(n²)`.

```text
for i from 0 to n - 1:
    for j from 0 to n - 1:
        inspect(i, j)
```

## Dependent ranges

Do not assume every nested loop is quadratic. If the inner index advances across the whole input only once overall, the total work may be linear. Count how many times each operation executes across the entire algorithm.

For loops that repeatedly halve or double a value, the number of iterations is logarithmic: after `k` halvings, the remaining size is about `n / 2^k`.
$lesson$, 12, 1),
  ('arrays', 'array-traversal', 'A Reliable Array Scan', 'a-reliable-array-scan', $lesson$
## Maintain a running answer

Many array problems can be solved with one pass by keeping only the information needed so far. For example, to find the largest value, initialize the answer from the first element and update it whenever a larger value appears.

```text
best = values[0]
for i from 1 to length(values) - 1:
    if values[i] > best:
        best = values[i]
```

The loop invariant is that `best` is the largest value in the part of the array already visited. This also explains why an empty array needs separate handling before reading `values[0]`.
$lesson$, 8, 1),
  ('arrays', 'prefix-sum', 'Prefix Sums for Range Queries', 'prefix-sums-for-range-queries', $lesson$
## Build cumulative totals

Define `prefix[i]` as the sum of the first `i` values. Use an array of length `n + 1` with `prefix[0] = 0`; then `prefix[i + 1] = prefix[i] + values[i]`.

The sum of the inclusive range from `left` to `right` is:

```text
prefix[right + 1] - prefix[left]
```

After an `O(n)` preprocessing pass, each range-sum query takes `O(1)` time. This is useful when the input stays fixed and many range queries follow.

Choose a numeric type large enough for accumulated totals, which can exceed the range of any single input value.
$lesson$, 10, 1),
  ('strings', 'palindromes', 'Checking for Palindromes', 'checking-for-palindromes', $lesson$
## Compare mirrored characters

A palindrome reads the same forward and backward. Start one pointer at the first character and another at the last. If the characters differ, the string is not a palindrome; otherwise move both pointers inward.

This uses `O(n)` time and `O(1)` extra space. The loop only needs to compare while the left pointer is less than the right pointer.

## Clarify normalization

Some tasks treat uppercase and lowercase letters, spaces, or punctuation as equivalent. Normalize or skip those characters only when the problem statement asks for it. Keeping this rule explicit prevents accidental changes to the input's meaning.
$lesson$, 8, 1),
  ('two-pointers-and-sliding-window', 'variable-size-windows', 'Growing and Shrinking a Window', 'growing-and-shrinking-a-window', $lesson$
## Keep a valid interval

A variable-size window represents a contiguous range with endpoints `left` and `right`. Extend the right endpoint to include new values, then move the left endpoint while the window violates the required condition.

For nonnegative numbers, a running sum can support finding a shortest range whose sum reaches a target: add on the right, and while the sum is large enough, record the range and remove values from the left.

This reasoning depends on nonnegative values. With negative numbers, extending or shrinking the window does not change the sum monotonically, so a different technique may be required.
$lesson$, 10, 1)
) AS seed(topic_slug, subtopic_slug, title, slug, content, estimated_minutes, sort_order)
JOIN public.topics ON topics.slug = seed.topic_slug
JOIN public.subtopics
  ON subtopics.topic_id = topics.id
  AND subtopics.slug = seed.subtopic_slug
ON CONFLICT (subtopic_id, slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  estimated_minutes = EXCLUDED.estimated_minutes,
  sort_order = EXCLUDED.sort_order,
  is_published = EXCLUDED.is_published;

WITH seed (
  dependent_topic,
  dependent_subtopic,
  prerequisite_topic,
  prerequisite_subtopic
) AS (
  VALUES
  ('time-and-space-complexity', 'counting-operations', 'programming-fundamentals', 'loops-and-iteration'),
  ('arrays', 'array-fundamentals', 'programming-fundamentals', 'variables-and-data-types'),
  ('arrays', 'prefix-sum', 'time-and-space-complexity', 'analyzing-loops'),
  ('strings', 'string-fundamentals', 'arrays', 'array-fundamentals'),
  ('strings', 'character-frequency', 'hashing', 'hash-maps-and-sets'),
  ('searching-and-sorting', 'binary-search-fundamentals', 'arrays', 'array-traversal'),
  ('hashing', 'hash-maps-and-sets', 'programming-fundamentals', 'variables-and-data-types'),
  ('two-pointers-and-sliding-window', 'opposite-direction-pointers', 'arrays', 'array-traversal'),
  ('two-pointers-and-sliding-window', 'variable-size-windows', 'arrays', 'subarrays'),
  ('linked-lists', 'node-and-list-representation', 'programming-fundamentals', 'functions-and-scope'),
  ('stacks-and-queues', 'stack-fundamentals', 'arrays', 'array-fundamentals'),
  ('recursion-and-backtracking', 'call-stack-and-base-cases', 'programming-fundamentals', 'functions-and-scope'),
  ('trees-and-binary-search-trees', 'tree-representation', 'recursion-and-backtracking', 'call-stack-and-base-cases'),
  ('heaps-and-priority-queues', 'heap-properties', 'trees-and-binary-search-trees', 'tree-representation'),
  ('graphs', 'breadth-first-search', 'stacks-and-queues', 'queue-and-deque-fundamentals'),
  ('graphs', 'depth-first-search', 'recursion-and-backtracking', 'call-stack-and-base-cases'),
  ('greedy-algorithms', 'recognizing-greedy-choices', 'time-and-space-complexity', 'asymptotic-notation'),
  ('dynamic-programming', 'memoization', 'recursion-and-backtracking', 'recursive-decomposition'),
  ('dynamic-programming', 'state-and-recurrence-design', 'time-and-space-complexity', 'analyzing-loops'),
  ('tries', 'trie-representation', 'trees-and-binary-search-trees', 'tree-representation'),
  ('tries', 'trie-representation', 'strings', 'string-fundamentals'),
  ('bit-manipulation', 'binary-representation', 'programming-fundamentals', 'variables-and-data-types')
)
INSERT INTO public.subtopic_prerequisites
  (subtopic_id, prerequisite_subtopic_id)
SELECT dependent.id, prerequisite.id
FROM seed
JOIN public.topics AS dependent_topic
  ON dependent_topic.slug = seed.dependent_topic
JOIN public.subtopics AS dependent
  ON dependent.topic_id = dependent_topic.id
  AND dependent.slug = seed.dependent_subtopic
JOIN public.topics AS prerequisite_topic
  ON prerequisite_topic.slug = seed.prerequisite_topic
JOIN public.subtopics AS prerequisite
  ON prerequisite.topic_id = prerequisite_topic.id
  AND prerequisite.slug = seed.prerequisite_subtopic
ON CONFLICT (subtopic_id, prerequisite_subtopic_id) DO NOTHING;
