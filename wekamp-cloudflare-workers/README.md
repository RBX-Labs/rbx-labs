# WeKamp Cloudflare Workers

Cloudflare Workers for WeKamp routes hosted under the RBX Labs Cloudflare zone.

## Workers

- `store-redirect-worker` - app-store redirects, share-link browser fallbacks, and Stream Chat token minting.

## Deploy

Deploy each Worker from its own directory:

```bash
cd wekamp-cloudflare-workers/store-redirect-worker
npm run deploy
```

