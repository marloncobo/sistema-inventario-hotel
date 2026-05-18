/**
 * Utilidades para formatear fechas y horas de forma consistente
 * en el chatbot y otras partes de la aplicación
 */

/**
 * Opciones para formatear la fecha y hora
 */
export interface DateFormatOptions {
  showDate?: boolean;
  showTime?: boolean;
  showSeconds?: boolean;
  compact?: boolean;
}

/**
 * Formatea una fecha en formato ISO 8601 o Date
 * Retorna objeto con fecha y hora formateados por separado
 */
export function formatDateTime(
  dateValue: string | Date,
  options: DateFormatOptions = {}
): { date: string; time: string; fullString: string } {
  const {
    showDate = true,
    showTime = true,
    showSeconds = false,
    compact = false
  } = options;

  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;

  // Validar que la fecha sea válida
  if (isNaN(date.getTime())) {
    return {
      date: 'Fecha inválida',
      time: '',
      fullString: 'Fecha inválida'
    };
  }

  let formattedDate = '';
  let formattedTime = '';

  if (showDate) {
    // Formatear fecha en formato: "18 de mayo de 2026" o "18/05/2026"
    formattedDate = compact
      ? date.toLocaleDateString('es-CO', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit'
        })
      : date.toLocaleDateString('es-CO', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
  }

  if (showTime) {
    // Formatear hora en formato: "14:30" o "14:30:45"
    const timeFormat: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    if (showSeconds) {
      timeFormat.second = '2-digit';
    }

    formattedTime = date.toLocaleTimeString('es-CO', timeFormat);
  }

  // Combinar fecha y hora
  let fullString = '';
  if (showDate && showTime) {
    fullString = compact
      ? `${formattedDate} ${formattedTime}`
      : `${formattedDate} a las ${formattedTime}`;
  } else if (showDate) {
    fullString = formattedDate;
  } else if (showTime) {
    fullString = formattedTime;
  }

  return {
    date: formattedDate,
    time: formattedTime,
    fullString
  };
}

/**
 * Formatea solo la hora en formato "HH:mm" o "HH:mm:ss"
 */
export function formatTimeOnly(
  dateValue: string | Date,
  includeSeconds: boolean = false
): string {
  const result = formatDateTime(dateValue, {
    showDate: false,
    showTime: true,
    showSeconds: includeSeconds
  });
  return result.time;
}

/**
 * Formatea solo la fecha
 */
export function formatDateOnly(
  dateValue: string | Date,
  compact: boolean = false
): string {
  const result = formatDateTime(dateValue, {
    showDate: true,
    showTime: false,
    compact
  });
  return result.date;
}

/**
 * Retorna si la fecha es hoy
 */
export function isToday(dateValue: string | Date): boolean {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Retorna si la fecha es ayer
 */
export function isYesterday(dateValue: string | Date): boolean {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  );
}

/**
 * Formatea la fecha de forma relativa (p.ej: "Hoy a las 14:30", "Ayer a las 10:15")
 */
export function formatDateRelative(dateValue: string | Date): string {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;

  if (isToday(date)) {
    return `Hoy a las ${formatTimeOnly(date)}`;
  }

  if (isYesterday(date)) {
    return `Ayer a las ${formatTimeOnly(date)}`;
  }

  return formatDateTime(date, {
    showDate: true,
    showTime: true,
    compact: false
  }).fullString;
}
