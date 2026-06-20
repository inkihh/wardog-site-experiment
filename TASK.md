# Current Task

_No active task._

The previous task — rebranding the site to **DZDocs** — is complete:
all brand, Discord, and repo references updated across content/config/assets; the GitHub
repo renamed to `inkihh/DZDocs`; the example PBO prefix de-branded to `Acme\ExampleMod`; the
domain moved to `dzdocs.inkihh.de` (Hetzner DNS `CNAME` + GitHub Pages custom-domain cutover,
fresh Let's Encrypt cert, HTTPS live), with the old domain's DNS record removed; and the
deferred docs (CONCEPT.md, IMPLEMENTATION.md) scrubbed.

Follow-ons since: `dayzmodders.inkihh.de` now does a permanent (301) redirect to
`dzdocs.inkihh.de` — Hetzner DNS `CNAME → www`, plus an nginx vhost + Let's Encrypt cert
(auto-renew) on `inkihh-web-01`; and the landing-page "Built by the community" section and
the house rules were reframed around **correctness** (AI-authored content is welcome — the
only bar is that it's right), dropping the "Quality over volume" slogan.

Awaiting the next task.
