GRANT USAGE ON SCHEMA private TO anon;
GRANT EXECUTE ON FUNCTION private.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon;