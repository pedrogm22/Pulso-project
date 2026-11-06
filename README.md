# Pulso · Drum Practice Platform

Plataforma de estudo de bateria orientada a uma sessão musical sincronizada.
Fluxo central planejado: **Áudio → Timeline → Tab → Metrônomo → Scroll → Loop**.

Esta versão já permite testar **catálogo → busca → música → tab → reprodução**.
São três demos originais com grooves diferentes, 120 compassos no total, backing
sem bateria, play/pause, volume, velocidade, seek por compasso/seção, playhead e
acompanhamento automático. Catálogo e tabs são carregados do banco no servidor.
Metrônomo, loops, count-in, modo prática e autenticação ainda não estão disponíveis.

## Teste rápido

Abra `/search` e escolha uma música com tab. Quando houver link de vídeo associado,
somente o player incorporado do YouTube é usado e a tab acompanha a reprodução;
se o YouTube não tocar, não há troca para um arquivo local. A incorporação não
substitui autorização/licenciamento dos titulares;
ajuste a velocidade para 75% e clique em um compasso ou seção para mudar de trecho.
As funções de tab sincronizada aparecem nas músicas que já têm tab. As demais
mostram o player oficial e informam que a tab ainda não está disponível; novas
tabs devem vir de material próprio, licenciado ou autorizado.
As faixas de demonstração **Primeiro pulso** (100 BPM), **Groove da noite** (90 BPM)
e **Luz da manhã** (120 BPM) continuam usando seus áudios locais. A tab usa HH/SD/BD para
chimbal/caixa/bumbo e inclui legenda completa. Scroll manual suspende acompanhamento;
o botão “Retomar acompanhamento” o reativa. As faixas são demos, não músicas comerciais.

## Stack

Next.js 16 / App Router, React 19, TypeScript strict, Tailwind 4, PostgreSQL 17,
Prisma 7 com adapter pg, Zod e Vitest. Node 24 LTS; npm e lockfile versionado.
ESLint é executado separadamente do build.

## Instalação e execução

```powershell
npm ci
Copy-Item .env.example .env
npm run db:generate
npm run dev
```

Abra http://localhost:3000 após configurar o banco e executar o seed abaixo.
As páginas agora dependem do PostgreSQL; falhas não são substituídas por mocks.
Em macOS/Linux, use `cp .env.example .env`. Não versione `.env`.

## Banco, migrations e seed

Instale Docker com Compose ou use um PostgreSQL existente configurando
`DATABASE_URL`. As credenciais de exemplo servem apenas ao banco local, exposto
somente em 127.0.0.1. Para iniciar o banco de desenvolvimento:

```powershell
docker compose up -d --wait
npm run db:deploy
npm run db:seed
npm run db:seed
npm run db:import-local-songs
npm run db:verify
```

`db:deploy` aplica migrations versionadas. Para mudanças futuras no schema, use
`npm run db:migrate -- --name nome_da_mudanca`, revise SQL e versione a migration.
Não use db push para substituir o histórico. O seed só modifica os IDs reservados
`demo-*`, preserva dados de usuário e é transacional no banco. Executá-lo duas
vezes verifica idempotência; `db:verify` confirma 5 seções e 40 compassos por música,
481/561/561 eventos e três faixas. Não execute seed em produção automaticamente.

Para preencher os metadados do catálogo no banco depois das migrations, execute
`npm run db:import-local-songs`. O comando é idempotente, não copia áudio, não
cria tabs comerciais e preserva tabs e reproduções já cadastradas. BPM e duração
desconhecidos permanecem nulos em vez de receber valores inventados. Confira
licenças e autorização das tabs antes de importá-las ou publicá-las.

O seed gera três WAVs em `public/audio/`, com baixo e harmonia: 96 segundos a
100 BPM, aproximadamente 106,67 segundos a 90 BPM e 80 segundos a 120 BPM.
Os dados não dependem de gravações
comerciais. Se o seed rodar em outra máquina, gere o áudio também no build web:

```powershell
npm run demo:audio
```

Após geração e com o servidor ativo, `/audio/primeiro-pulso.wav` permite ouvir a
faixa diretamente. As páginas de música também possuem player. Licença dos assets:
CC0-1.0; veja [public/audio/README.md](public/audio/README.md).

Alternativa sem Docker para desenvolvimento: `npx prisma dev --name pulso-foundation
--port 51420 --db-port 51421 --shadow-db-port 51422` (em uma única linha). Mantenha
esse processo aberto e copie a URL PostgreSQL exibida para `DATABASE_URL` no `.env`;
então execute deploy/seed/verify normalmente. Não use esse servidor em produção.
Essa alternativa foi usada na validação local desta entrega; o Compose/CI usa
PostgreSQL 17 e ainda requer execução no respectivo ambiente.

## Verificação

```powershell
npm run check
npm run build
npm start
```

`check`: generate/validate Prisma, ESLint, typecheck e Vitest. O build valida a
compilação de produção. `npm run test:watch` abre o modo contínuo. CI provisiona
PostgreSQL, aplica migration, executa seed duas vezes, verifica banco e faz build.
Testes unitários não comprovam conectividade com PostgreSQL nem precisão de áudio.

## Preparação para publicação (Vercel + PostgreSQL gerenciado)

O projeto ainda não está publicado. Para preparar um deploy:

1. Importe o repositório no Vercel e configure Node.js 24.
2. Configure estas variáveis no ambiente Production do Vercel:
   - `DATABASE_URL`: URL de runtime do PostgreSQL gerenciado. Se o provedor oferecer
     pooler, use a URL pooled aqui.
   - `BETTER_AUTH_SECRET`: segredo aleatório exclusivo de produção com pelo menos
     32 caracteres.
   - `BETTER_AUTH_URL` e `SITE_URL`: URL HTTPS final do site.
   - `ADMIN_EMAIL`: endereço da conta que terá acesso administrativo; é uma
     variável privada do servidor, não use `NEXT_PUBLIC_`.
   - `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` somente se o login Google for
     habilitado, com o callback `${BETTER_AUTH_URL}/api/auth/callback/google`.
3. Configure `DIRECT_URL` como URL PostgreSQL direta (sem pooler) no ambiente de
   deploy usado para migrações. `prisma migrate deploy` usa `DIRECT_URL` quando
   ela existe; a aplicação continua usando `DATABASE_URL`.
4. Aplique `npm run db:deploy` ao banco de produção antes de liberar o tráfego.
   O build padrão executa `prisma generate && next build`; ele não migra nem faz
   seed do banco automaticamente.
5. Faça o smoke test em produção: catálogo, páginas de música, login/admin se
   habilitados, YouTube no Chrome e a API do Top 10. O Top 10 começa vazio e
   registra músicas do catálogo na primeira reprodução.

Não copie `.env` local nem credenciais para o repositório. O deploy requer um
repositório remoto conectado ao provedor e acesso à conta de hospedagem e ao
banco; nenhum desses recursos é criado por `npm run build`.

Teste manual desta entrega: abrir `/`, navegar com Tab, usar “Pular para o
conteúdo”, navegar às âncoras, testar 375/768/1280px e acessar um endereço inexistente.
Teste também a busca sem resultados, artista e uma música inexistente (404).

## Configuração

| Variável | Uso |
| --- | --- |
| DATABASE_URL | URL PostgreSQL de runtime; obrigatória para operações de banco |
| DIRECT_URL | URL PostgreSQL direta para migrações quando `DATABASE_URL` usa pooler |
| SITE_URL | URL pública do site, usada como base de autenticação/canonical |
| BETTER_AUTH_SECRET | Segredo Better Auth; obrigatório em produção |
| BETTER_AUTH_URL | URL base HTTPS de Better Auth em produção |
| ADMIN_EMAIL | E-mail autorizado para a área administrativa (somente servidor) |

Nenhuma variável de banco é pública. O runtime valida a conexão apenas ao criar
o cliente. CLI Prisma usa a conexão local de exemplo se não houver variável,
para permitir generate/validate sem segredos. Use `.env` antes de migrate/seed.

## Estrutura

```text
src/app/                 shell público, loading, erro e 404
src/components/ui/       componentes conforme utilizados
src/domain/music/        documento musical e invariantes
src/lib/db/              cliente lazy e fábrica para scripts
src/lib/validation/      ambiente de banco
prisma/                  schema, migrations, fixture, seed e verificação
scripts/                 gerador de áudio original
tests/                   testes de integridade
docs/                    arquitetura e planejamento
```

UI futura usará service/repository em vez de acessar Prisma. Não existem camadas
vazias, store global, autenticação simulada ou SDK de analytics adicionado sem uso.
Domínio não importa Next/React/Prisma, permitindo reutilização em outros clientes.

## Documentação e limites

- [Diagnóstico, riscos e plano técnico](docs/implementation-plan.md)
- [Arquitetura e decisões](docs/architecture.md)
- [Modelo de dados](docs/domain-model.md)
- [Contrato futuro de áudio](docs/audio-engine.md)
- [Contrato futuro da timeline](docs/timeline-engine.md)
- [Roadmap e aceite do MVP](docs/roadmap.md)
- [Resultados da validação local](docs/validation.md)

Autenticação, autorização de escrita, rate limiting e SEO completo entram junto
das funcionalidades correspondentes. Esta base não tem
endpoints públicos de escrita ou upload. Modelos de favoritos e sessões antecipam
o domínio; não significam funcionalidades de conta prontas.

Riscos centrais: latência de seek/loop do HTMLAudio, precisão do click, buffering,
restrições de áudio em mobile e sincronização manual de gravações humanas.
O player usa o relógio do áudio para a tab; precisão de loop/click ainda não foi
implementada nem medida. Os documentos iniciais em docs registram o plano da
Foundation; veja docs/validation.md para o estado de validação mais recente.
Use branch/commits pequenos por milestone; não publique credenciais ou áudio sem licença.
