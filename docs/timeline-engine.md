# Timeline Engine — contrato planejado

Implementação na milestone 3, sem dependência de UI, banco ou plataforma.

Entrada: documento validado + currentTime em segundos.
Saída: currentSection, currentMeasure, currentBeat, progressWithinMeasure,
nextMeasure. Busca binária nos intervalos ordenados; BPM nominal não substitui
timestamps. Progresso = clamp((time-start)/(end-start), 0, 1).

Fronteira exata pertence ao compasso que começa naquele instante. Final da música
retorna último compasso com progresso 1. Antes do primeiro timestamp: estado de
espera; gaps: sem compasso ativo e referência ao próximo. Rejeitar tempo não finito.
Beat local usa duração explícita/assinatura; futuro beat-map para rubato dentro do
compasso sem alterar timestamps já armazenados.

Loop será intervalo [A.startTime, B.endTime); cruzar B faz seek A e invalida o
agendamento do metrônomo. Auto-follow reage à troca de compasso, não a um timer
de scroll. Scroll manual suspende acompanhamento e oferece retomada explícita.

Testar 0, 4.5, boundaries, último frame, gaps, anacruse, assinatura variável,
mudança de rate e loops. Os testes desta Foundation cobrem somente integridade
dos documentos/seed; ainda não são testes do engine.
