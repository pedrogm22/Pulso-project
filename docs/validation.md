# Validação da Foundation

## Atualização — catálogo e prática inicial

Três músicas persistidas, com 120 compassos e três WAVs originais gerados.
Seed executado novamente sem duplicação; verificação cobre todas as demos.
`npm run check`: lint, typecheck e 20 testes passaram. Build de produção passou.
Timeline testada em boundaries, gaps, término e documentos de BPM diferentes.
Regressão de seek: clock de mídia com precisão de microssegundos não deve
selecionar o compasso anterior nos timestamps fracionários de 90 BPM.

Funcionalidades atuais: busca, artista, música, tab SSR, play/pause, volume,
velocidade, seek de compasso/seção, playhead por rAF e auto-follow sem timer de pixels.
Próximas etapas: loop, metrônomo, count-in, modo prática e atalhos completos.

Chromium/Playwright: homepage com três cards; busca por Groove; abertura das
três músicas com 40 compassos cada; reprodução real avançando currentTime;
rate 75%; pausa; seek ao compasso 9 e ao refrão; larguras 375/768/1280 sem
overflow; resultado vazio; música inexistente retorna HTTP 404; página do
artista com três músicas; nenhum erro JavaScript. Inspeção visual desktop/mobile.
Servidor de preview e banco Prisma dev foram deixados ativos para teste local.

## Registro da Foundation

Ambiente: Windows, Node 24.14.1, npm 11.19.0. Data: 18/09/2026.

- `npm run check`: Prisma generate/validate, lint sem avisos, typecheck e 10 testes passaram.
- `npm run build`: build de produção passou; página inicial e 404 pré-renderizadas.
- `npm audit`: zero vulnerabilidades após overrides documentados na arquitetura.
- `npm run demo:audio`: WAV PCM de 96s, 4.233.644 bytes gerado.
- `prisma migrate deploy`: migration aplicada no servidor local `prisma dev`.
- `prisma db seed`: duas execuções bem-sucedidas.
- `npm run db:verify`: documento persistido válido; 5 seções, 40 compassos,
  481 eventos, 1 AudioTrack.
- Chromium via Playwright, build de produção: `/` retornou 200 em larguras
  375, 768 e 1280px, sem overflow horizontal e sem erros JavaScript.
- Inspeção visual de capturas desktop/mobile; primeiro foco no link de pular
  conteúdo, CTA navega para `#demo`, rota inexistente retorna 404 e áudio retorna
  200 com 4.233.644 bytes. Não equivale a uma auditoria completa WCAG.

Docker/PostgreSQL 17 não estão instalados no ambiente auditado. O workflow está
configurado para testar esse ambiente; execução remota de CI não foi realizada.
Não confundir sucesso em Prisma dev com validação operacional de produção.

Ainda não aplicável: testes de precisão do player, timeline engine, click e loop,
porque essas funcionalidades pertencem às próximas milestones.
