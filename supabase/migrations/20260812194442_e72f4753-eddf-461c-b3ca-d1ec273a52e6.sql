
CREATE POLICY "own folder read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'property-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));
CREATE POLICY "own folder insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own folder update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'property-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));
CREATE POLICY "own folder delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'property-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));
