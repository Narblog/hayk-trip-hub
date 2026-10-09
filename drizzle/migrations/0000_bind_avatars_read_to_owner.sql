DROP POLICY IF EXISTS "avatars readable by everyone" ON storage.objects;

CREATE POLICY "avatars readable by owner"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND owner_id = (select auth.uid()::text));