# Arquitetura

## Atualização: Discovery e prática inicial

Homepage, busca, artista e música agora consultam PostgreSQL por
`features/songs/service → repository → lib/db`. Conteúdo é SSR, com metadata
por música e erro explícito se o banco estiver indisponível. Não existe fallback.
`PracticePlayer` recebe apenas documento validado e URL do áudio; `AudioEngine`
centraliza comandos. Timeline pura em `domain/music/timeline` faz busca binária.
Estado React muda por compasso; playhead usa CSS/ref por rAF. Viewer memoizado.
Os contratos abaixo e nos documentos de engine registram também trabalho futuro.

## Implementado na Foundation

App Router entrega a página base por Server Components. Apenas a fronteira de
erro é cliente. CSS usa tokens sem fontes ou imagens remotas. Domínio musical
é TypeScript + Zod; Prisma fica em `src/lib/db` e nunca deve ser importado pela UI.
O singleton é lazy: build e shell público não precisam de conexão com banco.
Scripts administrativos usam a mesma fábrica de conexão e encerram o pool.

## Fronteiras para as próximas fases

```text
Server page / route / action
           ↓
Feature service (validação, autorização, regras)
           ↓
Repository (mapeia registros para domínio)
           ↓
Prisma / PostgreSQL

AudioEngine → TimelineEngine → Viewer / Scroll / Metronome / Loop
```

Rotas futuras: `/search?q=...`, `/artists/[artistSlug]`,
`/songs/[artistSlug]/[songSlug]`. Não criar aliases concorrentes.
Conteúdo público e metadata serão renderizados no servidor; player será ilha
cliente. React state/context primeiro, sem store externo até demonstrar necessidade.

## Decisões

- ADR-001: player define tempo; nada de scroll em pixels por segundo.
- ADR-002: timestamps por compasso, assinatura local e eventos estruturados.
- ADR-003: Prisma 7 estável com adapter PostgreSQL; evitar release candidate 8.
- ADR-004: áudio demo original gerado localmente; nenhum serviço externo de mídia.
- ADR-005: auth e endpoints mutáveis apenas na milestone de contas; nenhuma
  identidade simulada ou rota aberta de escrita nesta fundação.
- ADR-006: nenhuma consulta falsa ou fallback silencioso se PostgreSQL falhar.
- ADR-007: ESLint 9.39.5 temporariamente fixado porque os plugins React/import/a11y
  do eslint-config-next 16.3.5 falham com ESLint 10. Revisitar junto do config Next.
  Overrides deepmerge-ts 8.0.2 e mysql2 3.24.4 corrigem alertas transitivos da CLI
  Prisma; validar generate/migrate/seed ao atualizar essas dependências.

Telemetria futura será injetada por um único serviço tipado; inicialmente sem
analytics externo, cookies de rastreamento ou transmissão de dados pessoais.
Erros públicos não expõem stack traces ou URLs de conexão.

Referências consultadas: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation),
[Prisma 7 upgrade](https://docs.prisma.io/docs/guides/upgrade-prisma-orm/v7).
