import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import pool from '../../config/db';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest, IssueRow, ReporterInfo } from '../../types';

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

async function attachReporters(issues: IssueRow[]) {
  if (issues.length === 0) return [];

  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];

  const usersResult = await pool.query<ReporterInfo>(
    'SELECT id, name, role FROM users WHERE id = ANY($1)',
    [reporterIds]
  );

  const reporterMap = new Map<number, ReporterInfo>();
  for (const user of usersResult.rows) {
    reporterMap.set(user.id, user);
  }

  return issues.map(({ reporter_id, ...rest }) => ({
    ...rest,
    reporter: reporterMap.get(reporter_id) ?? null,
  }));
}

export async function getAllIssues(req: Request, res: Response, next: NextFunction) {
  try {
    const { sort, type, status } = req.query as {
      sort?: string;
      type?: string;
      status?: string;
    };

    const conditions: string[] = [];
    const values: string[] = [];
    let paramIndex = 1;

    if (type && ['bug', 'feature_request'].includes(type)) {
      conditions.push(`type = $${paramIndex++}`);
      values.push(type);
    }

    if (status && ['open', 'in_progress', 'resolved'].includes(status)) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = sort === 'oldest' ? 'ORDER BY created_at ASC' : 'ORDER BY created_at DESC';

    const result = await pool.query<IssueRow>(
      `SELECT * FROM issues ${whereClause} ${orderClause}`,
      values
    );

    const issuesWithReporters = await attachReporters(result.rows);

    sendSuccess(res, StatusCodes.OK, 'Issues fetched successfully', issuesWithReporters);
  } catch (err) {
    next(err);
  }
}

export async function getSingleIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const result = await pool.query<IssueRow>(
      'SELECT * FROM issues WHERE id = $1',
      [id]
    );

    if (!result.rowCount || result.rowCount === 0) {
      sendError(res, StatusCodes.NOT_FOUND, 'Issue not found.');
      return;
    }

    const [issueWithReporter] = await attachReporters(result.rows);

    sendSuccess(res, StatusCodes.OK, 'Issue fetched successfully', issueWithReporter);
  } catch (err) {
    next(err);
  }
}

export async function updateIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { user } = req as AuthRequest;
    const { title, description, type, status } = req.body as {
      title?: string;
      description?: string;
      type?: string;
      status?: string;
    };

    const issueResult = await pool.query<IssueRow>(
      'SELECT * FROM issues WHERE id = $1',
      [id]
    );

    if (!issueResult.rowCount || issueResult.rowCount === 0) {
      sendError(res, StatusCodes.NOT_FOUND, 'Issue not found.');
      return;
    }

    const issue = issueResult.rows[0];

    if (user.role === 'contributor') {
      if (issue.reporter_id !== user.id) {
        sendError(res, StatusCodes.FORBIDDEN, 'You can only edit your own issues.');
        return;
      }
      if (issue.status !== 'open') {
        sendError(res, StatusCodes.CONFLICT, 'You can only edit issues that are still open.');
        return;
      }
    }

    if (title && title.length > 150) {
      sendError(res, StatusCodes.BAD_REQUEST, 'title must not exceed 150 characters.');
      return;
    }

    if (description && description.length < 20) {
      sendError(res, StatusCodes.BAD_REQUEST, 'description must be at least 20 characters.');
      return;
    }

    if (type && !['bug', 'feature_request'].includes(type)) {
      sendError(res, StatusCodes.BAD_REQUEST, 'type must be either "bug" or "feature_request".');
      return;
    }

    if (status && !['open', 'in_progress', 'resolved'].includes(status)) {
      sendError(res, StatusCodes.BAD_REQUEST, 'status must be "open", "in_progress", or "resolved".');
      return;
    }

    const updatedTitle = title ?? issue.title;
    const updatedDescription = description ?? issue.description;
    const updatedType = type ?? issue.type;
    const updatedStatus = status ?? issue.status;

    const updated = await pool.query<IssueRow>(
      `UPDATE issues
       SET title = $1, description = $2, type = $3, status = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [updatedTitle, updatedDescription, updatedType, updatedStatus, id]
    );

    sendSuccess(res, StatusCodes.OK, 'Issue updated successfully', updated.rows[0]);
  } catch (err) {
    next(err);
  }
}
