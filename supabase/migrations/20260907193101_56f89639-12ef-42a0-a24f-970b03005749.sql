CREATE POLICY "avatars readable by everyone" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');
CREATE POLICY "users manage own avatar insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users manage own avatar update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users manage own avatar delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.property_host(p_property_id uuid)
RETURNS TABLE(full_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(NULLIF(TRIM(pr.full_name), ''), 'StayLand'), pr.avatar_url
  FROM public.properties p
  JOIN public.profiles pr ON pr.id = p.owner_id
  WHERE p.id = p_property_id AND p.status = 'APPROVED' AND p.is_active;
$$;
GRANT EXECUTE ON FUNCTION public.property_host(uuid) TO anon, authenticated;