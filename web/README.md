# Atias: aplicación web

Web de la cooperativa, con Next.js, Tailwind CSS, framer-motion y React Query.

**Todos los datos son simulados** (`src/lib/simulated.ts`). `src/lib/api.ts` es el único punto que cambiará al conectar la API de Express. Los cálculos están en `src/lib/calc.ts`.

```powershell
npm install
npm run dev     # http://localhost:3000
npm test
```

Para revisar estados, añade `?demo=error` o `?demo=carga` a la dirección.
