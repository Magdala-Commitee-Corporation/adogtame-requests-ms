# adogtame-requests-ms

Microservicio `Requests` de Adogtame. Función AWS Lambda en TypeScript detrás de su propia API HTTP de API Gateway, desplegada con SST v4.

Documentación del servicio: [`adog_MS.md`](https://github.com/Magdala-Commitee-Corporation/adogtame-docs/blob/main/agent/instruments/adog_MS.md).

## Ambientes

| Stage | API directa | Por CloudFront |
|---|---|---|
| `dev` | https://requests-api.dev.adogtame.vieerr.xyz | https://dev.adogtame.vieerr.xyz/api/requests |
| `prod` | https://requests-api.adogtame.vieerr.xyz | https://adogtame.vieerr.xyz/api/requests |

La API limita el tráfico a 50 peticiones por segundo con ráfagas de 100 y responde 429 al exceder (RNF-23).

## Uso

```bash
npm install
npm run dev          # sst dev en el stage dev
npm run deploy:dev
npm run deploy:prod
```

Requiere el perfil de AWS `bier-personal`.
