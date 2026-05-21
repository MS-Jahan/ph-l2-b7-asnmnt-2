import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err.stack);
  sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Something went wrong on the server.', err.message);
}
