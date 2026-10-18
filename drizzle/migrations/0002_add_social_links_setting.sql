INSERT INTO public.platform_settings (key, value) VALUES
('social_links', '{"instagram":"","facebook":"","telegram":""}')
ON CONFLICT (key) DO NOTHING;