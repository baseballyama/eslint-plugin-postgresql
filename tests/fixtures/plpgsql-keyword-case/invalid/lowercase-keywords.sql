CREATE FUNCTION foo() RETURNS void AS $$
declare
  user_count integer;
begin
  if user_count is null then
    raise notice 'hello';
  end if;
end;
$$ LANGUAGE plpgsql;
