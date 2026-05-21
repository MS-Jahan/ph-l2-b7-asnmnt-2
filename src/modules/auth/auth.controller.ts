import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import pool from '../../config/db';
import { sendSuccess, sendError } from '../../utils/response';
import { UserRow } from '../../types';

const SALT_ROUNDS = 10;

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role } = req.body as {
      name: string;
      email: string;
      password: string;
      role: string;
    };

    if (!name || !email || !password) {
      sendError(res, StatusCodes.BAD_REQUEST, 'name, email and password are required.');
      return;
    }

    const validRoles = ['contributor', 'maintainer'];
    const assignedRole = role && validRoles.includes(role) ? role : 'contributor';

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      sendError(res, StatusCodes.BAD_REQUEST, 'An account with this email already exists.');
      return;
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query<UserRow>(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, hashed, assignedRole]
    );

    sendSuccess(res, StatusCodes.CREATED, 'User registered successfully', result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      sendError(res, StatusCodes.BAD_REQUEST, 'email and password are required.');
      return;
    }

    const result = await pool.query<UserRow>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (!result.rowCount || result.rowCount === 0) {
      sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid email or password.');
      return;
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid email or password.');
      return;
    }

    const payload = { id: user.id, name: user.name, role: user.role };
    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    sendSuccess(res, StatusCodes.OK, 'Login successful', {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
}
