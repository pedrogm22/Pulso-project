# Tab de Paranoid

`prisma/tabs/paranoid.txt` é o texto enviado pelo usuário a partir da tab de
https://www.cifraclub.com.br/black-sabbath/paranoid/tabs-bateria/.
O arquivo preserva as quebras de linha recebidas para permitir a conferência.

O importador `src/domain/music/ascii-tab.ts` aceita este formato específico:
seções, blocos numerados consecutivos, oito linhas e 16 posições por compasso
em 4/4. Cada posição equivale a uma semicolcheia. Linhas incompletas,
símbolos desconhecidos, instrumentos repetidos e saltos na numeração causam erro.
Não é um importador universal de tablaturas ASCII.

São 10 seções e 112 compassos. `f` vira uma articulação `FLAM`, mantendo a
nota principal na posição escrita. `x`, `X`, `o` e `f` também são armazenados
em `DrumEvent.sourceSymbol` e exibidos como no original. A fonte não inclui
legenda para a diferença entre `x` e `X`; nenhuma abertura de chimbal ou
acentuação é inferida. Velocity 100 é um valor padrão, não uma transcrição
de dinâmica. O player toca o backing; não sintetiza os eventos de bateria.

A sincronização permanece aproximada, com início em zero e BPM informado de 163.
Os 112 compassos duram cerca de 164,91 segundos; a faixa cadastrada tem
169,308 segundos. Não há compassos adicionais inventados para completar o
áudio. Para sincronização fiel, é necessário conferir os limites dos compassos
contra a gravação, incluindo offset e variações de andamento.

Para atualizar somente essa tab no banco configurado:

```sh
npm run db:generate
npm run db:deploy
npm run db:import-paranoid
npm run db:verify
```

O importador mantém os IDs dos compassos existentes, substitui seus eventos e
remove os compassos excedentes apenas dessa tab. Não executa a limpeza de
catálogo do seed completo. O seed também usa a mesma conversão.

`tests/ascii-tab.test.ts` compara todas as células com o texto de origem e
confere flams, viradas, silêncio inicial, encerramento e rejeição de entradas
inválidas. `db:verify` confere os eventos persistidos, incluindo os símbolos.
