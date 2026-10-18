import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, any>;
  errors?: Record<string, any>;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorDetail: any = err.name || 'ServerError';

  // Handle Mongoose duplicate key error (e.g. unique email)
  if (err.code === 11000 && err.keyValue) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue)[0];
    message = `An account with this ${duplicatedField} already exists.`;
    errorDetail = 'ConflictError';
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    const validationMessages = Object.values(err.errors).map((e: any) => e.message);
    message = validationMessages.join(', ');
    errorDetail = 'ValidationError';
  }

  // Handle Mongoose invalid ObjectId CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier format.';
    errorDetail = 'CastError';
  }

  // Handle JSON parse error in body
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload in request body.';
    errorDetail = 'BadRequest';
  }

  if (process.env.NODE_ENV !== 'test' && statusCode === 500) {
    console.error(`[Error] ${req.method} ${req.url} ->`, err);
  }

  res.status(statusCode).json({
    message,
    error: errorDetail
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  res.status(404).json({
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    error: 'NotFound'
  });
};

