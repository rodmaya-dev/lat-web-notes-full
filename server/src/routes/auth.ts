
import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.js';
import { auth } from '../middleware/auth.js';
import { loginLimiter, registerLimiter } from '../middleware/limiter.js';

const router = Router();

router.post('/auth/register', registerLimiter, register);
router.post('/auth/login', loginLimiter, login);
router.get('/auth/me', auth, getProfile);

export default router;
