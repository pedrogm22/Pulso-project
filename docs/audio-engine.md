# Audio Engine — contrato planejado

Implementação reservada à milestone 3. Não existe player funcional na Foundation.

API: play, pause, seek(seconds), setVolume(0..1), setPlaybackRate(rate),
getCurrentTime, getDuration, subscribe e dispose. Eventos: ready, play, pause,
seek, timeupdate, ended, buffering e error. Nenhum componente manipulará áudio
fora desta camada. Carregamento e falhas serão estados explícitos.

Começar com HTMLAudioElement; considerar Web Audio para loops sem gaps após
medir latência real. Não prometer precisão de sample com seek de HTMLAudio.
Playhead via rAF/ref; estado React apenas quando necessário para UI.

MetronomeEngine usará AudioContext e lookahead: extrair posições dos beats da
timeline, converter diferença temporal pela velocidade e agendar no audio clock.
Seek, pause, buffering, mudança de rate e loop invalidam clicks agendados.
SetInterval pode alimentar lookahead, nunca determinar sozinho o instante do click.
Count-in: 0/1/2 compassos, assinatura do trecho e velocidade atual; só iniciar
áudio após terminar contagem. Pausar/cancelar precisa invalidar toda a contagem.

Teste futuro em desktop, Safari/iOS e tablet: gesto inicial, interrupções,
rate 50–100%, seek, loop de quatro compassos e retorno do segundo plano.
