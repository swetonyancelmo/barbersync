---
name: barbersync-run-verify
description: >
  Use ao rodar, buildar, semear ou verificar de ponta a ponta o BarberSync
  (API NestJS + fronts Next.js). Cobre a ordem de build, o banco em Docker na
  porta 5433, o seed, e um padrão de teste e2e via script Node/fetch — além das
  pegadinhas que já causaram falsos negativos (EADDRINUSE com processo antigo
  servindo código velho, dist/main.js sumindo, disponibilidade dependente do
  expediente). Gatilhos: "rodar o projeto", "testar a mudança", "verificar o
  fluxo", "subir a API".
---

# Rodar e verificar o BarberSync

## Subir o ambiente

```bash
docker compose up -d db          # Postgres publicado na 5433 (ver gotcha abaixo)
npm install
npm run build:shared             # SEMPRE antes de api/fronts
cp apps/api/.env.example apps/api/.env
npm run seed --workspace @barbersync/api
# 3 terminais:
npm run dev:api                  # http://localhost:3333/api
npm run dev:client               # http://localhost:3000
npm run dev:admin                # http://localhost:3001
```

Logins do seed: `admin@barbersync.com` e `joao@cliente.com` — senha `123456`.

## Gotchas de ambiente (já morderam antes)

- **Postgres nativo do Windows ocupa a 5432** → o docker-compose publica o banco
  em **5433**. O `.env` usa `DB_PORT=5433`. Conectar na 5432 dá `auth_failed`
  (é outro Postgres). Verifique quem escuta: `Get-NetTCPConnection -LocalPort 5432`.
- **EADDRINUSE na 3333 / falso negativo:** uma instância antiga da API continua
  servindo **código velho** e seus testes batem nela. **Sempre mate o node antes
  de subir a API para testar:**
  `powershell.exe -NoProfile -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"`.
  Confirme no log de boot que não há `EADDRINUSE` e que apareceu
  `Nest application successfully started`.
- **`dist/main.js` sumiu:** cache incremental órfão. Mantenha `incremental:false`
  no `apps/api/tsconfig.json`; se ocorrer, `rm -rf apps/api/dist apps/api/tsconfig.tsbuildinfo && npx nest build`.

## Padrão de teste e2e (rápido, sem framework)

Script ESM com `fetch` contra a API. Faça login para pegar o JWT e exercite o fluxo:

```bash
node --input-type=module -e '
const API="http://localhost:3333/api";
const call=async(p,{token,method="GET",body}={})=>{const r=await fetch(API+p,{method,
  headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
  body:body?JSON.stringify(body):undefined});const t=await r.text();let j;try{j=JSON.parse(t)}catch{j=t}
  if(!r.ok)throw new Error(`${method} ${p} ${r.status}: ${t}`);return j};
const ok=(c,m)=>{if(!c)throw new Error("FAIL "+m);console.log("  ✓ "+m)};
const adm=await call("/auth/login",{method:"POST",body:{email:"admin@barbersync.com",senha:"123456"}});
ok(adm.user.role==="ADMIN","login admin");
'
```

### Ao criar agendamentos em teste

A disponibilidade lê do **expediente** (módulo `schedule`): domingo é fechado por
padrão e slots de hoje já podem estar no passado. Então escolha uma **data futura
em dia útil** e um slot livre:

```js
const d=new Date(); d.setDate(d.getDate()+3); while(d.getDay()===0) d.setDate(d.getDate()+1);
const data=d.toISOString().slice(0,10);
const grade=await call(`/appointments/availability?tenantId=${tid}&barbeiroId=${bId}&data=${data}`,{token});
const slot=[...grade.manha,...grade.tarde].find(s=>s.disponivel); // pode ser undefined se fechado
```

### Verificar notificações

Com `NOTIFICATIONS_CHANNEL=log` (padrão), a confirmação de um agendamento loga
`[SIMULADO] ...` no stdout da API. Redirecione o log e confira:
`node dist/main.js > /tmp/api.log 2>&1 &` e depois `grep -c "SIMULADO" /tmp/api.log`.

## Encerrar

Ao terminar o teste, mate o node de novo (evita o EADDRINUSE do próximo run):
`powershell.exe -NoProfile -Command "Get-Process node | Stop-Process -Force"`.
O container `db` pode ficar de pé (mantém o seed).
