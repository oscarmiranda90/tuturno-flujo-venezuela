export type WebVoiceStatus = { playing: boolean; blocked: boolean; error: string | null };

/** Reutiliza un elemento de audio para que una pulsación habilite la reproducción de los siguientes pasos. */
export function createWebVoicePlayer(
  onStatus: (status: WebVoiceStatus) => void,
  createMedia: () => HTMLAudioElement = () => new Audio(),
) {
  let media: HTMLAudioElement | null = null;
  let source = '';
  let generation = 0;
  const status: WebVoiceStatus = { playing: false, blocked: false, error: null };
  const update = (patch: Partial<WebVoiceStatus>) => {
    Object.assign(status, patch);
    onStatus({ ...status });
  };
  const stop = () => {
    generation++;
    media?.pause();
    update({ playing: false });
  };
  return {
    play(uri: string) {
      const token = ++generation;
      if (!media) {
        media = createMedia();
        media.preload = 'auto';
        media.onended = () => update({ playing: false });
        media.onpause = () => update({ playing: false });
      }
      if (source !== uri) {
        source = uri;
        media.src = uri;
      } else {
        media.currentTime = 0;
      }
      // Ejecuta play durante la pulsación, antes de esperar respuestas o enviar mensajes a otra ventana.
      void media.play().then(() => {
        if (token === generation) update({ playing: true, blocked: false, error: null });
      }).catch((error: Error) => {
        if (token !== generation) return;
        update({
          playing: false,
          blocked: error.name === 'NotAllowedError',
          error: error.name === 'NotAllowedError' ? null : 'No se pudo reproducir el audio.',
        });
      });
    },
    stop,
    dispose() {
      generation++;
      if (media) {
        media.onended = null;
        media.onpause = null;
        media.pause();
        media.removeAttribute('src');
        media.load();
        media = null;
      }
    },
  };
}
