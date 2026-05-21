import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
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
