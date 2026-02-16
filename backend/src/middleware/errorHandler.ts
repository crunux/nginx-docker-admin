import type { Request, Response, NextFunction } from 'express'
import { AppError, mapSystemError } from '../utils/errors'

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Convertir errores de sistema si llegaron sin mapear
  const error = err instanceof AppError ? err : mapSystemError(err)

  // Log detallado solo en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${error.code}] ${error.message}`)
  }

  res.status(error.statusCode).json({
    error:   error.message,
    code:    error.code,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: error.stack
    }),
  })
}