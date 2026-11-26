SELECT o.id FROM orders o JOIN regions r ON r.region_id = o.region_id AND (r.tenant_id = o.tenant_id AND r.zone_id = o.zone_id);
