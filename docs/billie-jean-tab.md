# Billie Jean — partitura interativa

O PDF fornecido pelo usuário foi preservado em `prisma/tabs/billie-jean-source.pdf`
apenas como referência. Não é exibido nem servido pela página.

## Transcrição

`prisma/billie-jean-song.ts` transcreve os 144 compassos e 14 trechos do PDF:
groove recorrente, aberturas e pedal do chimbal, crashes, notas fantasma e viradas.
As posições são contadas a partir de zero. A nota extra no compasso 44 ocorre em
2.75 (última semicolcheia do terceiro tempo), não em 2.5. O compasso 144 contém
três tempos, conforme o encerramento parcial da fonte. Não foram criadas notas
para preencher a duração do MP3.

A tab usa STANDARD. VexFlow desenha pauta, notas, hastes, barras, acentos e
parênteses como SVG a partir dos eventos. O player destaca cada grupo de notas
simultâneas, move o cursor e acompanha o compasso na tela.

## Sincronização

`scripts/align-billie-jean.py` analisa a cópia local privada do MP3 fornecido com FFmpeg e NumPy.
Detecta ataques por fluxo espectral (janela 1024, salto 128, 22050 Hz), acompanhando
575 batidas próximas de 117 BPM com variação de andamento. O resultado fica em
`prisma/tabs/billie-jean-timing.json`, incluindo SHA-256 do MP3. O importador
recusa uma gravação diferente da usada para alinhar a partitura.

O primeiro ataque está próximo de 0.122 s; o compasso 121 começa em 245.528 s.
Uma grade fixa a 117 BPM já estaria cerca de 0.75 s atrasada nesse trecho.
As seis últimas fronteiras, no fade de volume muito baixo, são extrapoladas
do andamento anterior. O limite final é a duração decodificada (294.025 s).
A análise tem resolução de cerca de 5.8 ms, o que não garante precisão auditiva
de 5.8 ms. Subdivisões entre batidas são interpoladas. A transcrição representa
o PDF enviado; não é uma validação independente de cada toque da gravação.

O site incorpora o vídeo associado do YouTube; não publica nem usa a cópia local
do MP3 como player. O destaque usa o relógio do player incorporado. Pausa, seek,
reprodução lenta e metrônomo seguem a mesma grade, armazenada em `Measure.beatTimes`. O instrumento
FOOT_HI_HAT representa o pedal de chimbal separadamente dos toques com baqueta.

## Importação

```powershell
npm run db:deploy
npm run db:generate
npm run db:import-local-songs
npm run db:import-billie-jean
```

A importação preserva as outras músicas e mantém os IDs quando repetida. Os MP3s
de origem ficam fora de `public/` e não são copiados nem cadastrados como áudio.
Para realinhar outro MP3, execute `python scripts/align-billie-jean.py` com NumPy
e FFmpeg disponíveis e confira o novo resultado antes de importar.

`tests/billie-jean.test.ts` confere seções, notas especiais, compasso final,
durações e conversão entre posição musical e tempo. A verificação no navegador
cobre renderização, reprodução, pausa, seeks nas viradas, velocidade de 50%,
metrônomo, layout móvel e regressão da tab de Paranoid.
