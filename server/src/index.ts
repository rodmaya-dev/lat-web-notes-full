// dotenv debe cargarse antes de importar cualquier módulo que lea process.env
// al momento de importarse. Por eso va primero, antes que el resto de los imports.
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import noteRoutes from './routes/notes.js';
import authRoutes from './routes/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Vercel pone un proxy delante de la app, así que req.ip sería la IP del proxy
// y el rate limiter contaría a todos los usuarios como uno solo.
// El 1 significa "confía solo en el primer proxy". Un valor mayor, o `true`,
// permitiría que un cliente falsifique su IP escribiendo X-Forwarded-For.
// Debe ir antes de cualquier middleware que use la IP.
app.set('trust proxy', 1);

// Solo se acepta el origen del front end. En producción se define CLIENT_ORIGIN
// en las variables de entorno de Vercel; el valor por defecto es para desarrollo.
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));

app.use(express.json());

// No depende de token ni de base de datos, para poder verificar rápido
// si el despliegue está vivo. Usa el mismo formato { success, data, error }
// que el resto de la API.
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: { status: 'ok' },
    error: null,
  });
});

app.use(noteRoutes);
app.use(authRoutes);

// El orden importa: notFoundHandler va después de todas las rutas (atrapa lo que
// nadie respondió) y errorHandler siempre al final para capturar los errores
// de todo lo anterior.
app.use(notFoundHandler);
app.use(errorHandler);

mongoose
  // maxPoolSize limita las conexiones por instancia. En serverless cada instancia
  // abre su propio pool, y el plan gratuito de la base tiene un tope de 500
  // conexiones en total. El valor por defecto (100) lo agotaría con pocas instancias.
  .connect(process.env.MONGO_URI!, { maxPoolSize: 10 })
  .then(() => {
    console.log('Conectado a MongoDB');
    // Vercel acepta tanto `export default app` como app.listen. Se mantiene
    // app.listen para que el mismo archivo funcione en local y en producción.
    // Solo se levanta el servidor cuando la base ya conectó, para no aceptar
    // peticiones que fallarían sin base de datos.
    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    // Sin base de datos la API no sirve para nada, así que se termina el proceso
    // en lugar de quedar a medias. El código 1 indica error a la plataforma.
    console.error('Error de conexión', err);
    process.exit(1);
  });