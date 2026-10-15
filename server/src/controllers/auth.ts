// server/src/controllers/auth.ts

import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({
      success: false,
      data: null,
      error: { message: 'Los campos email, password y name son obligatorios' },
    });
    return;
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({
      success: false,
      data: null,
      error: { message: 'Los campos email y password deben ser texto' },
    });
    return;
  }  

  if (password.length < 8) {
    res.status(400).json({
      success: false,
      data: null,
      error: { message: 'La contraseña debe tener al menos 8 caracteres' },
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({ email, password: hashedPassword, name });
    res.status(201).json({
      success: true,
      data: { userId: user._id, email: user.email, name: user.name },
      error: null,
    });
  } catch (err: unknown) {
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      res.status(409).json({
        success: false,
        data: null,
        error: { message: 'Ese email ya está en uso' },
      });
      return;
    }
    throw err;
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      data: null,
      error: { message: 'Los campos email y password son obligatorios' },
    });
    return;
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({
      success: false,
      data: null,
      error: { message: 'Credenciales inválidas' },
    });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      data: null,
      error: { message: 'Credenciales inválidas' },
    });
    return;
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });

  res.status(200).json({
    success: true,
    data: {
      token,
      user: { userId: user._id, email: user.email, name: user.name },
    },
    error: null,
  });
};

export const getProfile = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({
      success: false,
      data: null,
      error: { message: 'No se encontró el usuario' },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      user: { userId: user._id, email: user.email, name: user.name },
    },
    error: null,
  });
};
