import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import pool from '../../config/db';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest, IssueRow } from '../../types';

export async function createIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, type } = req.body as {
      title: string;
      description: string;
      type: string;
    };

    const reporter_id = (req as AuthRequest).user.id;

    if (!title || !description || !type) {
      sendError(res, StatusCodes.BAD_REQUEST, 'title, description and type are required.');
      return;
    }

    if (title.length > 150) {
      sendError(res, StatusCodes.BAD_REQUEST, 'title must not exceed 150 characters.');
      return;
    }

    if (description.length < 20) {
      sendError(res, StatusCodes.BAD_REQUEST, 'description must be at least 20 characters.');
      return;
    }

    if (!['bug', 'feature_request'].includes(type)) {
      sendError(res, StatusCodes.BAD_REQUEST, 'type must be either "bug" or "feature_request".');
      return;
    }

    const result = await pool.query<IssueRow>(
      `INSERT INTO issues (title, description, type, reporter_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, type, reporter_id]
    );

    sendSuccess(res, StatusCodes.CREATED, 'Issue created successfully', result.rows[0]);
  } catch (err) {
    next(err);
  }
}
