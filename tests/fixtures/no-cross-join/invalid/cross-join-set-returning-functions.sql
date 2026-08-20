SELECT r.id, f.id
FROM unnest(ARRAY[1, 2]) AS r(id)
CROSS JOIN unnest(ARRAY[3, 4]) AS f(id);
