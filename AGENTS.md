<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Optimize owner-uploaded property photos in the browser before storage upload (max 1920px, WebP when supported) to avoid sending oversized originals.
- Package galleries use `packages.image_urls` alongside the existing cover image so older package cards remain compatible while detail pages show admin-uploaded photos.
- The admin booking overview reads the shared booking selection through existing admin-scoped RLS, not through privileged clients, to preserve guest privacy.
- App emails use the server-only managed send helper and React Email registry; do not create queues or generic send endpoints because delivery is managed externally.
- Preserve server-only environment loading and entities v4 aliases in Vite; email rendering needs private configuration and compatible entity decoding.
- Pass /lovable/* through request guards unchanged; each managed email handler authenticates its own caller.
