# Roadmap

1. **Foundation (entrega atual):** projeto, schema, migration, seed, contratos,
   shell responsivo, validação e CI. Execução do PostgreSQL depende de ambiente local/CI.
2. **Discovery:** repositories/services, homepage de catálogo, busca por música
   e artista, páginas públicas, metadata dinâmica, canonical, OpenGraph, sitemap,
   robots e estados vazios.
3. **Practice Engine:** timeline pura testada; AudioEngine; DrumTabViewer com
   seek e highlight; atualização visual desacoplada do render da página.
4. **Practice Tools:** loop por seleção, auto-follow, rate, click sincronizado,
   count-in, atalhos, modo prática e validação em tablet/mobile.
5. **Account:** Auth.js, autorização, favoritos e histórico.
6. **Community:** editor estruturado, revisões e moderação.
7. **Intelligence:** experimentos de transcrição e stems autorizados.

## Aceite do MVP (após fase 4)

Buscar demo → abrir música → play → áudio, seção e tab sincronizados → ativar
click → 75% → selecionar quatro compassos → loop → desativar loop → modo
prática → pause → seek com posição imediata correta. Validar acessibilidade,
mobile e comportamento de buffering. Interface bonita não substitui sincronização.

Não entram no MVP: marketplace, pagamentos, chat, feed, gamificação, IA real,
processamento pesado, upload irrestrito ou aplicativo nativo.
