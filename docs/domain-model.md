# Modelo de domínio

| Entidade | Responsabilidade |
| --- | --- |
| User | Identidade futura; sem autenticação implementada nesta fase |
| Artist | Nome e slug único |
| Song | Catálogo, BPM nominal, duração, dificuldade, assinatura padrão |
| Tab | Versão de arranjo, status, notação e autoria opcional |
| Section | Intervalo nomeado e ordem dentro da tab |
| Measure | Intervalo explícito, ordem global/local e assinatura própria |
| DrumEvent | Instrumento, beat, subdivisão, intensidade e articulação |
| AudioTrack | Asset autorizado, tipo, stem opcional e origem/licença |
| Favorite | Par único usuário/música |
| PracticeSession | Sessão vinculada à música e versão correta da tab |

Tempos são segundos na timeline da música. Ordem e beat são baseados em 1;
subdivision está em [0,1) e mede fração do beat definido pelo denominador.
Exemplo: em 4/4, beat 2 + subdivision 0.5 é a segunda colcheia do segundo tempo.
Não armazenar apenas strings de tab. Velocity: 1–127; silêncio = ausência de evento.

Intervalos serão [startTime, endTime); no final exato da música o engine retornará
o último compasso com progresso 1. Silêncios entre compassos são permitidos.
O validador rejeita overlaps, ordens inconsistentes, IDs duplicados e eventos fora
do compasso. Não exige BPM constante. SQL valida valores locais; regras entre
várias linhas exigirão validar o documento completo no service antes de publicar.

Measure carrega tabId para garantir unicidade global e FK composta para Section.
PracticeSession usa FK composta para garantir que tab e música correspondam.
Tabs com histórico não podem ser apagadas; devem ser arquivadas. Conteúdo filho
sem histórico acompanha exclusão do pai. Autoria torna-se nula se usuário for removido.

AudioTrack.offset: tempo da timeline correspondente a audio.currentTime = 0.
Conversão futura: timelineTime = audio.currentTime + offset. Seed usa offset zero.
Múltiplas faixas e stems estão modelados; mixer ainda não implementado.
