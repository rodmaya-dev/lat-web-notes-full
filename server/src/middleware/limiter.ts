import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  limit: 10, // máximo 10 peticiones por ventana
  message: {
    success: false,
    data: null,
    error: {
      message: 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo más tarde.',
    },
  },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ventana de 1 hora
  limit: 20, // máximo 20 peticiones por ventana
  message: {
    success: false,
    data: null,
    error: {
      message:
        'Demasiados registros desde esta dirección. Inténtalo de nuevo más tarde.',
    },
  },
});