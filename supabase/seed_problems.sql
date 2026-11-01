WITH seed (
  slug, title, difficulty, topic_slug, subtopic_slug, description,
  input_format, output_format, constraints, examples, hints
) AS (
  VALUES
    ('count-even-values', 'Count Even Values', 'easy', 'arrays', 'array-traversal',
     'Given a list of integers, count how many values are even.',
     'An integer n followed by n integers.', 'Print the number of even values.',
     ARRAY['0 <= n <= 100000', '-10^9 <= value <= 10^9'],
     '[{"input":"5\n2 7 4 9 10","output":"3"},{"input":"3\n1 3 5","output":"0"}]'::jsonb,
     '[{"text":"Scan each value exactly once."},{"text":"A value is even when its remainder after division by 2 is zero."}]'::jsonb),
    ('best-single-day-change', 'Best Single-Day Change', 'easy', 'arrays', 'array-fundamentals',
     'A sensor records one value per day. Find the largest increase from one day to a later day; return 0 if no increase occurs.',
     'An integer n followed by n daily values.', 'Print the maximum later-minus-earlier difference, or 0.',
     ARRAY['1 <= n <= 100000', '-10^6 <= value <= 10^6'],
     '[{"input":"6\n8 3 6 2 9 4","output":"7"},{"input":"4\n9 7 5 1","output":"0"}]'::jsonb,
     '[{"text":"Keep the smallest value seen before the current day."},{"text":"Compare each value with that earlier minimum."}]'::jsonb),
    ('longest-rising-streak', 'Longest Rising Streak', 'medium', 'arrays', 'array-traversal',
     'Find the length of the longest contiguous segment whose values strictly increase from left to right.',
     'An integer n followed by n integers.', 'Print the longest segment length.',
     ARRAY['1 <= n <= 200000', '-10^9 <= value <= 10^9'],
     '[{"input":"7\n1 3 5 2 4 6 8","output":"4"},{"input":"5\n5 4 3 2 1","output":"1"}]'::jsonb,
     '[{"text":"Track the current increasing segment length."},{"text":"Reset the segment when the current value is not greater than its predecessor."}]'::jsonb),
    ('maximum-subarray-total', 'Maximum Subarray Total', 'hard', 'arrays', 'kadanes-algorithm',
     'Find the largest possible sum of a non-empty contiguous segment in the given integer sequence.',
     'An integer n followed by n integers.', 'Print the maximum segment sum.',
     ARRAY['1 <= n <= 200000', '-10^9 <= value <= 10^9'],
     '[{"input":"8\n-3 4 -1 2 -6 3 1 -2","output":"5"},{"input":"4\n-8 -3 -5 -1","output":"-1"}]'::jsonb,
     '[{"text":"At each position decide whether to extend the current segment or start over."},{"text":"Keep a separate best answer so all-negative input is handled."}]'::jsonb),
    ('rotate-grid-ring', 'Rotate a Grid Ring', 'hard', 'arrays', 'matrix-problems',
     'Rotate the outer border of a rectangular grid one position clockwise; leave any interior cells unchanged.',
     'Rows r and columns c, followed by r rows of c integers.', 'Print the resulting grid, one row per line.',
     ARRAY['2 <= r, c <= 100', '0 <= grid value <= 10^6'],
     '[{"input":"3 3\n1 2 3\n4 5 6\n7 8 9","output":"4 1 2\n7 5 3\n8 9 6"},{"input":"2 3\n1 2 3\n4 5 6","output":"4 1 2\n5 6 3"}]'::jsonb,
     '[{"text":"List the border coordinates in clockwise order without repeating corners."},{"text":"Shift the collected values by one position, then write them back."}]'::jsonb),

    ('count-vowels-in-text', 'Count Vowels in Text', 'easy', 'strings', 'string-traversal',
     'Count the vowels a, e, i, o, and u in a line of text, ignoring letter case.',
     'One line containing letters and spaces.', 'Print the vowel count.',
     ARRAY['1 <= line length <= 200000', 'The line contains only English letters and spaces.'],
     '[{"input":"Algorithm practice","output":"6"},{"input":"rhythm","output":"0"}]'::jsonb,
     '[{"text":"Visit each character once."},{"text":"Normalize uppercase letters or compare both cases."}]'::jsonb),
    ('longest-mirror-substring', 'Longest Mirror Substring', 'medium', 'strings', 'palindromes',
     'Find the length of the longest contiguous substring that reads the same in both directions.',
     'A non-empty lowercase string.', 'Print the maximum palindrome length.',
     ARRAY['1 <= string length <= 2000', 'The string contains lowercase English letters only.'],
     '[{"input":"abacdfgdcaba","output":"3"},{"input":"racecarx","output":"7"}]'::jsonb,
     '[{"text":"Every palindrome has a center that is a character or a gap."},{"text":"Expand outward from each possible center while the endpoints match."}]'::jsonb),
    ('minimum-window-cover', 'Minimum Window Cover', 'hard', 'strings', 'string-traversal',
     'Find the shortest substring of a source string that contains every character of a target string with its required multiplicity. Print -1 if no such window exists.',
     'A source string and a target string on separate lines.', 'Print the shortest qualifying substring, choosing the earliest one on ties, or -1.',
     ARRAY['1 <= source length, target length <= 200000', 'Strings contain English letters only.'],
     '[{"input":"ADOBECODEBANC\nABC","output":"BANC"},{"input":"abc\nzz","output":"-1"}]'::jsonb,
     '[{"text":"Track the required count and current count for each target character."},{"text":"Expand the right edge until the window is valid, then shrink the left edge."}]'::jsonb),

    ('first-target-position', 'First Target Position', 'easy', 'searching-and-sorting', 'binary-search-fundamentals',
     'Given a sorted integer array, find the first zero-based position containing a target, or -1 when it is absent.',
     'n and target, followed by n sorted integers.', 'Print the first matching index, or -1.',
     ARRAY['0 <= n <= 200000', 'Array values are in nondecreasing order.'],
     '[{"input":"7 4\n1 2 4 4 4 8 9","output":"2"},{"input":"4 3\n1 2 5 7","output":"-1"}]'::jsonb,
     '[{"text":"Use a lower-bound style binary search."},{"text":"When equal, continue searching the left half."}]'::jsonb),
    ('first-true-capacity', 'First Feasible Capacity', 'medium', 'searching-and-sorting', 'binary-search-on-answers',
     'Items arrive in order and must be packed into at most k consecutive groups. Find the smallest capacity that can hold every group.',
     'n and k, followed by n nonnegative item sizes.', 'Print the minimum feasible capacity.',
     ARRAY['1 <= n <= 100000', '1 <= k <= n', '0 <= item size <= 10^9'],
     '[{"input":"5 3\n4 2 7 3 5","output":"8"},{"input":"4 1\n1 2 3 4","output":"10"}]'::jsonb,
     '[{"text":"A capacity is feasible if a greedy left-to-right packing uses at most k groups."},{"text":"Feasibility is monotonic as capacity increases."}]'::jsonb),
    ('count-inversions', 'Count Inversions', 'hard', 'searching-and-sorting', 'merge-sort',
     'Count pairs of indices i < j for which the value at i is greater than the value at j.',
     'An integer n followed by n integers.', 'Print the inversion count.',
     ARRAY['1 <= n <= 200000', '-10^9 <= value <= 10^9'],
     '[{"input":"5\n2 4 1 3 5","output":"3"},{"input":"4\n4 3 2 1","output":"6"}]'::jsonb,
     '[{"text":"A quadratic pair scan is too slow for the largest input."},{"text":"Count cross-half inversions while merging two sorted halves."}]'::jsonb),

    ('first-repeated-number', 'First Repeated Number', 'easy', 'hashing', 'duplicate-detection',
     'Scan an integer sequence from left to right and print the first value that has appeared before. Print NONE if no value repeats.',
     'An integer n followed by n integers.', 'Print the first repeated value or NONE.',
     ARRAY['0 <= n <= 200000', '-10^9 <= value <= 10^9'],
     '[{"input":"6\n8 3 5 3 8 2","output":"3"},{"input":"4\n1 2 3 4","output":"NONE"}]'::jsonb,
     '[{"text":"Keep a set of values already visited."},{"text":"Check membership before inserting the current value."}]'::jsonb),
    ('subarray-sum-count', 'Subarray Sum Count', 'medium', 'hashing', 'frequency-counting',
     'Count contiguous subarrays whose values sum to a target; array values may be negative.',
     'n and target, followed by n integers.', 'Print the number of matching subarrays.',
     ARRAY['1 <= n <= 200000', '-10^9 <= value, target <= 10^9'],
     '[{"input":"5 3\n1 2 -1 2 -1","output":"3"},{"input":"3 0\n1 2 3","output":"0"}]'::jsonb,
     '[{"text":"Use prefix sums so each subarray sum is a difference of two prefixes."},{"text":"For a current prefix p, count earlier prefixes equal to p minus target."}]'::jsonb),
    ('longest-zero-sum-range', 'Longest Zero-Sum Range', 'hard', 'hashing', 'frequency-counting',
     'Find the length of the longest contiguous range whose values sum to zero.',
     'An integer n followed by n integers.', 'Print the maximum length, or 0 if no such range exists.',
     ARRAY['0 <= n <= 200000', '-10^9 <= value <= 10^9'],
     '[{"input":"6\n4 -1 -3 2 -2 5","output":"5"},{"input":"3\n2 4 6","output":"0"}]'::jsonb,
     '[{"text":"Equal prefix sums mark a zero-sum range between their positions."},{"text":"Keep the earliest index for each prefix sum."}]'::jsonb),

    ('pair-sum-exists', 'Pair Sum Exists', 'easy', 'two-pointers-and-sliding-window', 'opposite-direction-pointers',
     'Given a sorted sequence and a target, determine whether two distinct positions sum to the target.',
     'n and target, followed by n sorted integers.', 'Print YES or NO.',
     ARRAY['0 <= n <= 200000', 'Values are sorted in nondecreasing order.'],
     '[{"input":"6 10\n1 2 4 6 8 9","output":"YES"},{"input":"4 20\n1 3 7 9","output":"NO"}]'::jsonb,
     '[{"text":"Start one pointer at each end of the sorted sequence."},{"text":"Move the pointer that makes the sum closer to the target."}]'::jsonb),
    ('shortest-target-window', 'Shortest Target Window', 'medium', 'two-pointers-and-sliding-window', 'variable-size-windows',
     'For positive array values, find the shortest contiguous segment with sum at least a target. Print 0 when none exists.',
     'n and target, followed by n positive integers.', 'Print the shortest segment length or 0.',
     ARRAY['1 <= n <= 200000', '1 <= target, value <= 10^9'],
     '[{"input":"6 11\n1 2 3 4 5 2","output":"3"},{"input":"4 30\n2 4 6 8","output":"0"}]'::jsonb,
     '[{"text":"Expand the right edge while the current sum is too small."},{"text":"Once the sum qualifies, shrink the left edge and record each length."}]'::jsonb),
    ('longest-bounded-range', 'Longest Bounded Range', 'hard', 'two-pointers-and-sliding-window', 'window-invariants',
     'Find the longest contiguous segment whose maximum and minimum values differ by at most a given limit.',
     'n and limit, followed by n integers.', 'Print the maximum segment length.',
     ARRAY['1 <= n <= 200000', '0 <= limit <= 10^9', '-10^9 <= value <= 10^9'],
     '[{"input":"7 4\n8 2 4 7 5 3 6","output":"4"},{"input":"4 0\n5 5 5 5","output":"4"}]'::jsonb,
     '[{"text":"Use monotonic deques to track the window maximum and minimum."},{"text":"Move the left edge while the max-minus-min invariant is violated."}]'::jsonb),

    ('list-middle-value', 'List Middle Value', 'easy', 'linked-lists', 'fast-and-slow-pointers',
     'Given a singly linked list, report the value at index floor(n/2), using zero-based indexing.',
     'n followed by n integer node values.', 'Print the middle node value.',
     ARRAY['1 <= n <= 200000', '-10^9 <= value <= 10^9'],
     '[{"input":"5\n7 2 9 4 6","output":"9"},{"input":"4\n3 8 1 5","output":"1"}]'::jsonb,
     '[{"text":"The input values describe the nodes in list order."},{"text":"A slow pointer moving once per step reaches the middle when a fast pointer moves twice."}]'::jsonb),
    ('cycle-entry-position', 'Cycle Entry Position', 'medium', 'linked-lists', 'cycle-detection',
     'A list is described by its next-index array, where -1 means the end. Find the index where a cycle begins, or -1 if the list terminates.',
     'n and start index, followed by n next indices.', 'Print the cycle-entry index or -1.',
     ARRAY['1 <= n <= 200000', 'Each next index is -1 or in [0,n).'],
     '[{"input":"5 0\n1 2 3 4 2","output":"2"},{"input":"4 0\n1 2 3 -1","output":"-1"}]'::jsonb,
     '[{"text":"Use slow and fast pointers to detect whether a cycle exists."},{"text":"After a meeting, reset one pointer to the start; advance both once to find the entry."}]'::jsonb),
    ('reorder-list-ends', 'Reorder List Ends', 'hard', 'linked-lists', 'reversing-a-list',
     'Reorder a list as first, last, second, second-last, continuing toward the center.',
     'An integer n followed by n node values.', 'Print the reordered values.',
     ARRAY['1 <= n <= 200000', '-10^9 <= value <= 10^9'],
     '[{"input":"6\n1 2 3 4 5 6","output":"1 6 2 5 3 4"},{"input":"5\n1 2 3 4 5","output":"1 5 2 4 3"}]'::jsonb,
     '[{"text":"Find the middle, reverse the second half, then weave the halves together."},{"text":"Use constant extra pointer storage rather than copying all nodes."}]'::jsonb),

    ('balanced-delimiters', 'Balanced Delimiters', 'easy', 'stacks-and-queues', 'stack-fundamentals',
     'Determine whether a string containing (), [], and {} has properly nested and matched delimiters.',
     'A line containing delimiter characters only.', 'Print YES when every delimiter is matched in order, otherwise NO.',
     ARRAY['0 <= string length <= 200000'],
     '[{"input":"{[()]}","output":"YES"},{"input":"([)]","output":"NO"}]'::jsonb,
     '[{"text":"Push opening delimiters onto a stack."},{"text":"Every closing delimiter must match the most recent unmatched opener."}]'::jsonb),
    ('next-greater-distance', 'Next Greater Distance', 'medium', 'stacks-and-queues', 'monotonic-stacks',
     'For each array position, find the distance to the next position on its right with a strictly greater value, or 0 if none exists.',
     'An integer n followed by n integers.', 'Print n distances.',
     ARRAY['1 <= n <= 200000', '-10^9 <= value <= 10^9'],
     '[{"input":"6\n2 1 5 3 4 6","output":"2 1 3 2 1 0"},{"input":"4\n7 6 5 4","output":"0 0 0 0"}]'::jsonb,
     '[{"text":"Keep indices whose next greater value has not been found."},{"text":"When a larger value arrives, resolve smaller values from the top of the stack."}]'::jsonb),
    ('sliding-window-maximum', 'Sliding Window Maximum', 'hard', 'stacks-and-queues', 'monotonic-queues',
     'For every contiguous window of length k, report its maximum value.',
     'n and k, followed by n integers.', 'Print one maximum per window.',
     ARRAY['1 <= k <= n <= 200000', '-10^9 <= value <= 10^9'],
     '[{"input":"8 3\n1 3 -1 -3 5 3 6 7","output":"3 3 5 5 6 7"},{"input":"4 1\n5 2 8 1","output":"5 2 8 1"}]'::jsonb,
     '[{"text":"Store candidate indices in a deque with values in decreasing order."},{"text":"Remove expired indices from the front and dominated values from the back."}]'::jsonb),

    ('power-by-recursion', 'Power by Recursion', 'easy', 'recursion-and-backtracking', 'call-stack-and-base-cases',
     'Compute a^n for a nonnegative integer exponent using a recursive divide-and-conquer method.',
     'Two integers a and n.', 'Print a raised to n.',
     ARRAY['-1000 <= a <= 1000', '0 <= n <= 60'],
     '[{"input":"3 5","output":"243"},{"input":"7 0","output":"1"}]'::jsonb,
     '[{"text":"The exponent zero is the base case."},{"text":"Compute the half power once, then square it; multiply by a when n is odd."}]'::jsonb),
    ('word-grid-search', 'Word Grid Search', 'medium', 'recursion-and-backtracking', 'constraint-search',
     'Determine whether a word can be traced through orthogonally adjacent grid cells without using any cell more than once.',
     'Rows, columns, the grid of lowercase letters, then the target word.', 'Print YES if a valid path exists, otherwise NO.',
     ARRAY['1 <= rows, columns <= 10', '1 <= word length <= 20'],
     '[{"input":"2 3\nabc\ndef\nbed","output":"YES"},{"input":"2 2\nab\ncd\nabcd","output":"NO"}]'::jsonb,
     '[{"text":"Try each cell matching the first character as a starting position."},{"text":"Mark a cell during a path and restore it when backtracking."}]'::jsonb),
    ('minimum-queen-conflicts', 'Place Nonattacking Queens', 'hard', 'recursion-and-backtracking', 'pruning-and-state-restoration',
     'Count ways to place n queens on an n by n board so that no two share a row, column, or diagonal.',
     'An integer n.', 'Print the number of valid placements.',
     ARRAY['1 <= n <= 14'],
     '[{"input":"4","output":"2"},{"input":"1","output":"1"}]'::jsonb,
     '[{"text":"Place one queen per row, testing columns in that row."},{"text":"Track occupied columns and both diagonal directions to prune invalid choices."}]'::jsonb),

    ('tree-node-count', 'Count Tree Nodes', 'easy', 'trees-and-binary-search-trees', 'tree-representation',
     'Given a binary tree in level order with # for missing children, count its non-empty nodes.',
     'A space-separated level-order representation, with # marking an absent child.', 'Print the number of non-empty nodes.',
     ARRAY['1 <= token count <= 200000', 'Node values are integers.'],
     '[{"input":"1 2 3 # # 4","output":"4"},{"input":"#","output":"0"}]'::jsonb,
     '[{"text":"Each token other than # represents one node."},{"text":"A level-order traversal can also validate how child positions are consumed."}]'::jsonb),
    ('validate-search-tree', 'Validate a Search Tree', 'medium', 'trees-and-binary-search-trees', 'binary-search-tree-invariants',
     'Determine whether a binary tree satisfies strict binary search tree ordering at every node.',
     'A space-separated level-order representation, with # for missing children.', 'Print YES if it is a valid search tree, otherwise NO.',
     ARRAY['1 <= token count <= 200000', 'Node values are distinct integers.'],
     '[{"input":"5 3 8 1 4 # 9","output":"YES"},{"input":"5 3 8 1 7 # 9","output":"NO"}]'::jsonb,
     '[{"text":"A node must satisfy bounds inherited from every ancestor, not just its direct parent."},{"text":"Carry an exclusive lower and upper bound during traversal."}]'::jsonb),
    ('lowest-common-ancestor-bst', 'Lowest Common Ancestor in a Search Tree', 'medium', 'trees-and-binary-search-trees', 'lowest-common-ancestor',
     'Find the lowest common ancestor of two present values in a binary search tree.',
     'A level-order tree representation followed by values p and q.', 'Print the ancestor value.',
     ARRAY['1 <= node count <= 200000', 'All node values are distinct.'],
     '[{"input":"6 2 8 0 4 7 9 3 5\n2 8","output":"6"},{"input":"6 2 8 0 4 7 9 3 5\n2 4","output":"2"}]'::jsonb,
     '[{"text":"Compare both target values with the current node."},{"text":"If both targets lie on one side, descend that side; otherwise the current node is the split."}]'::jsonb),
    ('maximum-tree-path-sum', 'Maximum Tree Path Sum', 'hard', 'trees-and-binary-search-trees', 'tree-recursion-patterns',
     'Find the maximum sum of values along any non-empty path in a binary tree. A path may start and end at any nodes.',
     'A space-separated level-order representation, with # for missing children.', 'Print the maximum path sum.',
     ARRAY['1 <= node count <= 200000', '-10^6 <= node value <= 10^6'],
     '[{"input":"-10 9 20 # # 15 7","output":"42"},{"input":"-3","output":"-3"}]'::jsonb,
     '[{"text":"A recursive result can extend through only one child when returned to the parent."},{"text":"At each node, separately consider a path joining both child contributions."}]'::jsonb)
)
INSERT INTO public.problems (
  title, slug, description, difficulty, topic_id, subtopic_id, constraints,
  input_format, output_format, examples, hints, supported_languages, is_published
)
SELECT
  seed.title,
  seed.slug,
  seed.description,
  seed.difficulty,
  topics.id,
  subtopics.id,
  seed.constraints,
  seed.input_format,
  seed.output_format,
  seed.examples,
  seed.hints,
  ARRAY['cpp', 'python', 'java'],
  TRUE
FROM seed
JOIN public.topics ON topics.slug = seed.topic_slug
JOIN public.subtopics
  ON subtopics.topic_id = topics.id
  AND subtopics.slug = seed.subtopic_slug
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty,
  topic_id = EXCLUDED.topic_id,
  subtopic_id = EXCLUDED.subtopic_id,
  constraints = EXCLUDED.constraints,
  input_format = EXCLUDED.input_format,
  output_format = EXCLUDED.output_format,
  examples = EXCLUDED.examples,
  hints = EXCLUDED.hints,
  supported_languages = EXCLUDED.supported_languages,
  is_published = EXCLUDED.is_published;

DO $$
DECLARE
  expected_problem_count INTEGER := 30;
  seeded_problem_count INTEGER;
BEGIN
  SELECT count(*) INTO seeded_problem_count
  FROM public.problems
  WHERE slug IN (
    'count-even-values', 'best-single-day-change', 'longest-rising-streak',
    'maximum-subarray-total', 'rotate-grid-ring', 'longest-mirror-substring',
    'count-vowels-in-text', 'minimum-window-cover', 'first-target-position', 'first-true-capacity',
    'count-inversions', 'first-repeated-number', 'subarray-sum-count',
    'longest-zero-sum-range', 'pair-sum-exists', 'shortest-target-window',
    'longest-bounded-range', 'list-middle-value', 'cycle-entry-position',
    'reorder-list-ends', 'balanced-delimiters', 'next-greater-distance',
    'sliding-window-maximum', 'power-by-recursion', 'word-grid-search',
    'minimum-queen-conflicts', 'tree-node-count', 'validate-search-tree',
    'lowest-common-ancestor-bst', 'maximum-tree-path-sum'
  );
  IF seeded_problem_count <> expected_problem_count THEN
    RAISE EXCEPTION
      'Expected % seeded problems but found %. Confirm the curriculum seed has been run.',
      expected_problem_count, seeded_problem_count;
  END IF;
END;
$$;

UPDATE public.problems
SET starter_code = jsonb_build_object(
  'cpp',
  E'#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // TODO: Solve ' || title || E'.\n    return 0;\n}\n',
  'python',
  E'import sys\n\n\ndef solve():\n    data = sys.stdin.read().split()\n    # TODO: Solve ' || title || E'.\n\n\nif __name__ == "__main__":\n    solve()\n'
)
WHERE slug IN (
  'count-even-values', 'best-single-day-change', 'longest-rising-streak',
  'maximum-subarray-total', 'rotate-grid-ring', 'count-vowels-in-text',
  'longest-mirror-substring', 'minimum-window-cover', 'first-target-position',
  'first-true-capacity', 'count-inversions', 'first-repeated-number',
  'subarray-sum-count', 'longest-zero-sum-range', 'pair-sum-exists',
  'shortest-target-window', 'longest-bounded-range', 'list-middle-value',
  'cycle-entry-position', 'reorder-list-ends', 'balanced-delimiters',
  'next-greater-distance', 'sliding-window-maximum', 'power-by-recursion',
  'word-grid-search', 'minimum-queen-conflicts', 'tree-node-count',
  'validate-search-tree', 'lowest-common-ancestor-bst', 'maximum-tree-path-sum'
);

INSERT INTO public.problem_tags (name, slug)
VALUES
  ('Array Scan', 'array-scan'),
  ('Prefix Sums', 'prefix-sums'),
  ('Dynamic Programming', 'dynamic-programming'),
  ('Strings', 'strings'),
  ('Binary Search', 'binary-search'),
  ('Sorting', 'sorting'),
  ('Hash Map', 'hash-map'),
  ('Two Pointers', 'two-pointers'),
  ('Sliding Window', 'sliding-window'),
  ('Linked List', 'linked-list'),
  ('Stack', 'stack'),
  ('Queue', 'queue'),
  ('Backtracking', 'backtracking'),
  ('Tree Traversal', 'tree-traversal'),
  ('Binary Search Tree', 'binary-search-tree')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

WITH seed (problem_slug, tag_slug) AS (
  VALUES
    ('count-even-values', 'array-scan'),
    ('best-single-day-change', 'array-scan'),
    ('longest-rising-streak', 'array-scan'),
    ('maximum-subarray-total', 'dynamic-programming'),
    ('rotate-grid-ring', 'array-scan'),
    ('count-vowels-in-text', 'strings'),
    ('longest-mirror-substring', 'strings'),
    ('minimum-window-cover', 'sliding-window'),
    ('first-target-position', 'binary-search'),
    ('first-true-capacity', 'binary-search'),
    ('count-inversions', 'sorting'),
    ('first-repeated-number', 'hash-map'),
    ('subarray-sum-count', 'prefix-sums'),
    ('longest-zero-sum-range', 'prefix-sums'),
    ('pair-sum-exists', 'two-pointers'),
    ('shortest-target-window', 'sliding-window'),
    ('longest-bounded-range', 'sliding-window'),
    ('list-middle-value', 'linked-list'),
    ('cycle-entry-position', 'linked-list'),
    ('reorder-list-ends', 'linked-list'),
    ('balanced-delimiters', 'stack'),
    ('next-greater-distance', 'stack'),
    ('sliding-window-maximum', 'queue'),
    ('power-by-recursion', 'backtracking'),
    ('word-grid-search', 'backtracking'),
    ('minimum-queen-conflicts', 'backtracking'),
    ('tree-node-count', 'tree-traversal'),
    ('validate-search-tree', 'binary-search-tree'),
    ('lowest-common-ancestor-bst', 'binary-search-tree'),
    ('maximum-tree-path-sum', 'tree-traversal')
)
INSERT INTO public.problem_tag_relations (problem_id, tag_id)
SELECT problems.id, problem_tags.id
FROM seed
JOIN public.problems ON problems.slug = seed.problem_slug
JOIN public.problem_tags ON problem_tags.slug = seed.tag_slug
ON CONFLICT (problem_id, tag_id) DO NOTHING;

INSERT INTO public.problem_test_cases (
  problem_id, input, expected_output, is_sample, sort_order
)
SELECT
  problems.id,
  example.value->>'input',
  example.value->>'output',
  TRUE,
  (example.ordinality - 1)::INTEGER
FROM public.problems
CROSS JOIN LATERAL jsonb_array_elements(problems.examples)
  WITH ORDINALITY AS example(value, ordinality)
WHERE problems.slug IN (
  'count-even-values', 'best-single-day-change', 'longest-rising-streak',
  'maximum-subarray-total', 'rotate-grid-ring',
  'count-vowels-in-text', 'longest-mirror-substring', 'minimum-window-cover',
  'first-target-position', 'first-true-capacity', 'count-inversions',
  'first-repeated-number', 'subarray-sum-count', 'longest-zero-sum-range',
  'pair-sum-exists', 'shortest-target-window', 'longest-bounded-range',
  'list-middle-value', 'cycle-entry-position', 'reorder-list-ends',
  'balanced-delimiters', 'next-greater-distance', 'sliding-window-maximum',
  'power-by-recursion', 'word-grid-search', 'minimum-queen-conflicts',
  'tree-node-count', 'validate-search-tree', 'lowest-common-ancestor-bst',
  'maximum-tree-path-sum'
)
ON CONFLICT (problem_id, sort_order) DO UPDATE SET
  input = EXCLUDED.input,
  expected_output = EXCLUDED.expected_output,
  is_sample = EXCLUDED.is_sample;

WITH private_cases (problem_slug, input, expected_output, sort_order) AS (
  VALUES
    ('count-even-values', '0', '0', 10),
    ('best-single-day-change', '5
3 1 4 2 7', '6', 10),
    ('longest-rising-streak', '5
1 2 3 2 3', '3', 10),
    ('maximum-subarray-total', '3
-5 -2 -7', '-2', 10),
    ('rotate-grid-ring', '2 2
1 2
3 4', '3 1
4 2', 10),
    ('count-vowels-in-text', 'Education', '5', 10),
    ('longest-mirror-substring', 'forgeeksskeegfor', '10', 10),
    ('count-inversions', '1
42', '0', 10),
    ('minimum-window-cover', 'aaab
aa', 'aa', 10),
    ('first-target-position', '6 2
1 2 2 2 4 8', '1', 10),
    ('first-true-capacity', '4 2
3 2 2 3', '5', 10),
    ('first-repeated-number', '7
9 2 5 1 2 9 2', '2', 10),
    ('subarray-sum-count', '4 0
0 0 0 0', '10', 10),
    ('longest-zero-sum-range', '5
1 -1 3 -3 2', '4', 10),
    ('pair-sum-exists', '5 11
1 2 4 7 9', 'YES', 10),
    ('shortest-target-window', '5 15
5 1 3 5 10', '2', 10),
    ('longest-bounded-range', '5 2
1 5 2 4 3', '3', 10),
    ('list-middle-value', '6
1 2 3 4 5 6', '4', 10),
    ('cycle-entry-position', '6 0
1 2 3 4 5 3', '3', 10),
    ('reorder-list-ends', '4
10 20 30 40', '10 40 20 30', 10),
    ('balanced-delimiters', '(([]))', 'YES', 10),
    ('next-greater-distance', '5
2 5 1 3 4', '1 0 2 1 0', 10),
    ('sliding-window-maximum', '5 2
-5 -2 -8 -1 -3', '-2 -2 -1 -1', 10),
    ('power-by-recursion', '-2 5', '-32', 10),
    ('word-grid-search', '2 2
ab
cd
acd', 'YES', 10),
    ('minimum-queen-conflicts', '8', '92', 10),
    ('tree-node-count', '10 5 15 3 7 # 18', '6', 10),
    ('validate-search-tree', '8 4 12 2 6 10 14', 'YES', 10),
    ('lowest-common-ancestor-bst', '8 4 12 2 6 10 14
2 6', '4', 10),
    ('maximum-tree-path-sum', '-2 1 3', '3', 10)
)
INSERT INTO public.problem_test_cases (
  problem_id, input, expected_output, is_sample, sort_order
)
SELECT problems.id, private_cases.input, private_cases.expected_output, FALSE,
  private_cases.sort_order
FROM private_cases
JOIN public.problems ON problems.slug = private_cases.problem_slug
ON CONFLICT (problem_id, sort_order) DO UPDATE SET
  input = EXCLUDED.input,
  expected_output = EXCLUDED.expected_output,
  is_sample = FALSE;
