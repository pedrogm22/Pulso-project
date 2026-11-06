# Plano técnico e diagnóstico

## Diagnóstico

Workspace auditado em 18/09/2026: diretório vazio, sem código, package.json,
instruções AGENTS.md locais ou repositório Git. Node 24 e npm 11 disponíveis.
Docker e psql não encontrados no PATH. Nenhuma credencial fornecida.

## Arquitetura proposta

Next.js App Router com Server Components para conteúdo indexável; ilhas cliente
somente onde interação justificar. TypeScript strict, Tailwind e tokens CSS.
PostgreSQL e Prisma com adapter pg. Zod nas fronteiras de entrada.

Fluxo de dados: página/route → service → repository → Prisma. Domínio puro sem
imports de React, Next ou Prisma. Relógio do AudioEngine será a fonte temporal;
TimelineEngine derivará seção, compasso e beat de timestamps explícitos.
UI de aplicação atualizará somente nas transições; playhead usará rAF/ref.

## Árvore inicial

```text
src/app/                 layout, página institucional, loading/error/not-found
src/components/ui/       componentes utilizados, sem biblioteca antecipada
src/domain/music/        contratos e validação do documento musical
src/lib/db/              configuração e fábrica do cliente Prisma
src/lib/validation/      validação de ambiente no servidor
prisma/                  schema, migrations, seed original
scripts/                 geração determinística de áudio demo
tests/                   integridade do domínio e fixture
docs/                    decisões, arquitetura, roadmap e contratos futuros
```

Features de songs, search e player surgirão na milestone correspondente.

## Dados e decisões

User → Tab (autoria opcional para conteúdo editorial); Artist → Song → Tab →
Section → Measure → DrumEvent. Song → AudioTrack. Favorite liga User e Song.
PracticeSession guarda referência à versão da tab. Ordem absoluta é única por
tab, além da ordem local por seção. Tempos em segundos double precision, compassos
com assinatura própria e eventos com beat baseado em 1 e subdivision fracionária.
AudioTrack registra fonte, licença, atribuição, tipo e stem opcional.

Nome provisório: Pulso. Interface pt-BR, código inglês. Sem Zustand, autenticação,
editor, uploads ou analytics externos nesta fase. Auth.js será integrado na fase
de contas, incluindo seus modelos de sessão; não criar login simulado.
Demo original sintetizada localmente, sem downloads de música comercial.

## Riscos e mitigação

- Drift, seek e loops: um relógio mestre, testes de fronteiras e rescheduling de clicks.
- Latência de HTMLAudio: medir em dispositivos reais antes de afirmar loops exatos;
  considerar AudioBuffer para trechos se a precisão for insuficiente.
- Tempo humano: timestamps explícitos; BPM apenas auxiliar para gerar o seed.
- Áudio móvel: desbloqueio por gesto, tratamento de interrupção e buffering.
- Banco ausente: Compose e CI com PostgreSQL; nenhuma troca silenciosa por mock.
- OneDrive pode interferir em arquivos de build; mover checkout se houver locks.
- Cross-row invariants exigem validação de documento no service além de SQL CHECKs.

## Etapas e primeira milestone

1. Foundation: configuração reproduzível, schema/migration, seed idempotente,
   áudio original, domínio validado, shell visual, CI, documentação.
2. Discovery: homepage completa, busca, artistas e músicas via repository/service.
3. Practice Engine: timeline pura e testes, áudio, viewer e sincronização.
4. Practice Tools: loop, velocidade, metrônomo, count-in, scroll, modo prática.
5. Accounts: autenticação, favoritos e histórico com autorização server-side.
6. Community; 7. Intelligence — somente após validar o fluxo principal.

Aceite da Foundation: instalar com lockfile, gerar Prisma, validar schema, lint,
typecheck, testes e build; migration + seed verificáveis em PostgreSQL; página
base acessível e responsiva. Não equivale ao aceite do MVP: sem player nesta fase.
