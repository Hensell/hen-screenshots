# Deployment

Production runs on **Cloudflare Workers Static Assets** at [screenshots.hensell.dev](https://screenshots.hensell.dev/), with the editor at `/studio/`. The Worker is named `hen-screenshots`; its custom domain is declared in [`wrangler.jsonc`](../wrangler.jsonc). Cloudflare manages the domain's DNS record and HTTPS certificate.

## Automatic deployments

**Cloudflare Workers Builds** connects directly to `Hensell/hen-screenshots` on GitHub. Every push to `main` installs dependencies, runs the tests and production build, then deploys if they pass. Settings live in **Workers & Pages → hen-screenshots → Settings → Build**:

| Setting                      | Value                                |
| ---------------------------- | ------------------------------------ |
| Production branch            | `main`                               |
| Root directory               | `/`                                  |
| Build command                | `npm run check`                      |
| Deploy command               | `npx wrangler deploy`                |
| Non-production branch builds | Disabled                             |
| Node.js                      | `22.21.1`, pinned in `.node-version` |

Build authentication is managed by Cloudflare's Git integration. No deployment credentials are stored in the repository.

## Local validation and manual deployment

```sh
npm ci
npm run check
npx wrangler deploy --dry-run
```

The Cloudflare Vite plugin generates `dist/wrangler.json` and prepares the frontend assets. There is no backend Worker logic or database binding. Local source screenshots, personal project backups, and capture tools are excluded from the build.

To publish from an authenticated Wrangler session after validation:

```sh
npx wrangler deploy
```

For a fork, choose your own Worker name and remove or replace the custom-domain route in `wrangler.jsonc`. Connect your own repository and Cloudflare account; the production domain above belongs to this project.

## Rollback

Restore a previous deployment from the Worker's **Deployments** page. Also revert the affected commit on `main` and push the correction so the next automated deployment uses the intended code.

## Browser data

Project storage is scoped to the browser and origin. Localhost projects do not automatically appear on the public domain. Download **Project file** from the local editor and use **Open project file** in the hosted studio to import a copy, including its source images.

## References

- [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
