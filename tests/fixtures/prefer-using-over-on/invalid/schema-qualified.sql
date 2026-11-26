SELECT public.orders.id
FROM public.orders
JOIN public.customers ON public.customers.customer_id = public.orders.customer_id;
