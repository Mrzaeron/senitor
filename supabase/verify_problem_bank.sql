SELECT
  COUNT(*) FILTER (WHERE is_published) AS total,
  COUNT(*) FILTER (WHERE is_published AND difficulty = 'easy') AS easy,
  COUNT(*) FILTER (WHERE is_published AND difficulty = 'medium') AS medium,
  COUNT(*) FILTER (WHERE is_published AND difficulty = 'hard') AS hard
FROM public.problems;

SELECT slug, COUNT(*) AS duplicate_count
FROM public.problems
GROUP BY slug
HAVING COUNT(*) > 1;
