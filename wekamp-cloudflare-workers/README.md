# WeKamp Cloudflare Workers

Cloudflare Workers for WeKamp routes hosted under the RBX Labs Cloudflare zone.

## Workers

- `store-redirect-worker` 
    - App-store redirects
    - Share-link browser fallbacks, 
    - Stream Chat token minting/provisioning, and 
    - Stream Video call token/id helpers.

## Deploy

Deploy each Worker from its own directory:

```bash
cd wekamp-cloudflare-workers/store-redirect-worker
npm run deploy
```
