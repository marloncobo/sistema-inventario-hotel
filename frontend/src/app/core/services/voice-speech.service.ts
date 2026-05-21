import { Injectable, signal } from '@angular/core';

type SpeechRecognitionCtor = new () => SpeechRecognition;
type SpeechRecognitionInstance = SpeechRecognition & { processLocally?: boolean };

export type VoiceSpeechHandlers = {
  onFinal: (transcript: string) => void;
  onError?: (message: string) => void;
  lang?: string;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

@Injectable({ providedIn: 'root' })
export class VoiceSpeechService {
  private static readonly LANG_CANDIDATES = ['es-US', 'es-ES', 'es-MX'] as const;
  private static readonly MAX_NETWORK_RETRIES = 3;
  private static readonly SILENCE_SEND_MS = 3000;

  private recognition: SpeechRecognitionInstance | null = null;
  private handlers: VoiceSpeechHandlers | null = null;
  private langIndex = 0;
  private networkRetries = 0;
  private noSpeechRetries = 0;
  private retryPass = 0;
  private stopping = false;
  private userStopped = false;
  private silenceStopped = false;
  private finalized = false;
  private bestTranscript = '';
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private hasCapturedSpeech = false;

  readonly isSupported = signal(this.detectSupport());
  readonly isListening = signal(false);
  readonly interimTranscript = signal('');

  toggle(handlers: VoiceSpeechHandlers): void {
    if (this.isListening()) {
      this.userStopped = true;
      this.stop();
      return;
    }
    void this.start(handlers);
  }

  async start(handlers: VoiceSpeechHandlers): Promise<void> {
    this.clearSilenceTimer();
    this.bestTranscript = '';
    this.hasCapturedSpeech = false;
    this.finalized = false;
    this.userStopped = false;
    this.silenceStopped = false;
    this.noSpeechRetries = 0;

    if (!this.isSupported()) {
      handlers.onError?.('Tu navegador no admite reconocimiento de voz. Prueba Chrome o Edge actualizado.');
      return;
    }

    if (!navigator.onLine) {
      handlers.onError?.('Se requiere internet para transcribir la voz en Edge.');
      return;
    }

    this.handlers = handlers;
    this.langIndex = 0;
    this.networkRetries = 0;
    this.retryPass = 0;

    const micReady = await this.ensureMicrophoneAccess();
    if (!micReady) {
      handlers.onError?.('Permiso de micrófono denegado. Candado en la barra → Permitir micrófono.');
      return;
    }

    this.beginRecognition();
  }

  stop(): void {
    this.clearSilenceTimer();
    this.stopping = true;

    if (!this.recognition) {
      this.finishAfterStop();
      return;
    }

    try {
      this.recognition.stop();
    } catch {
      this.finishAfterStop();
    }
  }

  private finishAfterStop(): void {
    if ((this.userStopped || this.silenceStopped) && this.salvageAndFinish()) {
      this.resetSession();
      return;
    }

    this.recognition = null;
    this.isListening.set(false);
    this.interimTranscript.set('');
    this.stopping = false;
  }

  private beginRecognition(): void {
    const handlers = this.handlers;
    if (!handlers) {
      return;
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      handlers.onError?.('Reconocimiento de voz no disponible.');
      return;
    }

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        /* noop */
      }
      this.recognition = null;
    }

    const recognition = new Recognition() as SpeechRecognitionInstance;
    recognition.lang = handlers.lang ?? VoiceSpeechService.LANG_CANDIDATES[this.langIndex];
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.isListening.set(true);
      this.stopping = false;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const { interim, finalText, combined } = this.extractTranscripts(event);
      this.bestTranscript = combined || this.bestTranscript;
      this.interimTranscript.set((finalText || interim).trim());

      if (this.bestTranscript.trim()) {
        this.hasCapturedSpeech = true;
        this.scheduleSilenceSend();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const code = event.error || 'unknown';

      if (code === 'aborted' || (this.stopping && code !== 'network')) {
        return;
      }

      if (code === 'network') {
        if (this.salvageAndFinish()) {
          this.resetSession();
          return;
        }

        if (this.networkRetries < VoiceSpeechService.MAX_NETWORK_RETRIES) {
          this.networkRetries += 1;
          this.langIndex = (this.langIndex + 1) % VoiceSpeechService.LANG_CANDIDATES.length;
          this.retryPass += 1;
          window.setTimeout(() => this.beginRecognition(), 800);
          return;
        }

        handlers.onError?.(this.mapError(code, event.message));
        this.resetSession();
        return;
      }

      if (code === 'no-speech') {
        if (this.salvageAndFinish()) {
          this.resetSession();
          return;
        }

        if (!this.hasCapturedSpeech && this.noSpeechRetries < 2) {
          this.noSpeechRetries += 1;
          window.setTimeout(() => this.beginRecognition(), 400);
          return;
        }

        handlers.onError?.(
          'No se detectó voz. Pulsa el micrófono y habla de inmediato, cerca del equipo.'
        );
        this.resetSession();
        return;
      }

      if (this.salvageAndFinish()) {
        this.resetSession();
        return;
      }

      handlers.onError?.(this.mapError(code, event.message));
      this.resetSession();
    };

    recognition.onend = () => {
      if (this.salvageAndFinish()) {
        this.resetSession();
        return;
      }

      if ((this.userStopped || this.silenceStopped) && this.salvageAndFinish()) {
        this.resetSession();
        return;
      }

      if (
        !this.stopping &&
        this.networkRetries > 0 &&
        this.networkRetries <= VoiceSpeechService.MAX_NETWORK_RETRIES
      ) {
        return;
      }

      if (this.isListening()) {
        this.isListening.set(false);
        this.interimTranscript.set('');
      }

      this.recognition = null;
      this.stopping = false;
    };

    this.recognition = recognition;

    try {
      recognition.start();
    } catch {
      handlers.onError?.('El micrófono está ocupado. Espera un segundo e inténtalo de nuevo.');
      this.resetSession();
    }
  }

  private scheduleSilenceSend(): void {
    this.clearSilenceTimer();
    if (!this.isListening() || !this.hasCapturedSpeech) {
      return;
    }

    this.silenceTimer = window.setTimeout(() => {
      this.silenceTimer = null;
      if (!this.isListening() || this.finalized) {
        return;
      }

      const text = (this.bestTranscript || this.interimTranscript()).trim();
      if (!text) {
        return;
      }

      this.silenceStopped = true;
      this.userStopped = true;
      this.stop();
    }, VoiceSpeechService.SILENCE_SEND_MS);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer !== null) {
      window.clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private extractTranscripts(event: SpeechRecognitionEvent): {
    interim: string;
    finalText: string;
    combined: string;
  } {
    let interim = '';
    let finalText = '';

    for (let i = 0; i < event.results.length; i += 1) {
      const chunk = event.results[i][0]?.transcript ?? '';
      if (event.results[i].isFinal) {
        finalText += chunk;
      } else {
        interim += chunk;
      }
    }

    const combined = `${finalText}${interim}`.trim();
    return { interim, finalText, combined };
  }

  private salvageAndFinish(explicit?: string): boolean {
    const handlers = this.handlers;
    if (!handlers || this.finalized) {
      return false;
    }

    const text = (explicit ?? this.bestTranscript ?? this.interimTranscript()).trim();
    if (!text) {
      return false;
    }

    this.finalized = true;
    handlers.onFinal(text);
    return true;
  }

  private resetSession(): void {
    this.clearSilenceTimer();
    this.recognition = null;
    this.isListening.set(false);
    this.interimTranscript.set('');
    this.bestTranscript = '';
    this.hasCapturedSpeech = false;
    this.stopping = false;
    this.userStopped = false;
    this.silenceStopped = false;
    this.finalized = false;
  }

  private async ensureMicrophoneAccess(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  private detectSupport(): boolean {
    return Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
  }

  private mapError(code: string, detail?: string): string {
    switch (code) {
      case 'not-allowed':
      case 'service-not-allowed':
        return 'Permiso de micrófono denegado. En Edge: candado → Micrófono → Permitir.';
      case 'no-speech':
        return 'No se detectó voz. Habla en cuanto pulses el micrófono.';
      case 'audio-capture':
        return 'No se encontró micrófono o está en uso por otra aplicación.';
      case 'network':
        return (
          'Edge no pudo conectar al servicio de voz en la nube. Activa en Windows: ' +
          'Configuración → Hora e idioma → Voz → Reconocimiento de voz en línea. ' +
          'También puedes escribir la pregunta.'
        );
      case 'service-not-available':
        return 'Servicio de voz no disponible. Actualiza Edge o usa Chrome.';
      case 'language-not-supported':
        return 'Idioma de voz no soportado. El sistema intentará otro idioma automáticamente.';
      case 'aborted':
        return 'Escucha cancelada.';
      default:
        return detail?.trim()
          ? `No se pudo transcribir (${code}): ${detail}`
          : `No se pudo transcribir la voz (${code}). En Edge activa el reconocimiento en línea en Windows o escribe el mensaje.`;
    }
  }
}
