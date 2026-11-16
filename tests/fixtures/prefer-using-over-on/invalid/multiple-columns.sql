SELECT o.id
FROM orders o
LEFT JOIN customers c ON (o.tenant_id = c.tenant_id AND c."CustomerId" = o."CustomerId");
SELECT o.id FROM orders o JOIN regions r ON ((r.region_id = o.region_id)) AND (r.tenant_id = o.tenant_id);
