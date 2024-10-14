import { NextFunction, Request, Response } from 'express'
import logger from '@helpers/logger'

export class ErrorHandler extends Error {
  statusCode: number
  message: string
  other?: object

  constructor(statusCode: number, message: string, otherParams: any = {}) {
    super()
    this.statusCode = statusCode
    this.message = message
    if (Object.keys(otherParams).length) this.other = otherParams
  }
}

export const handleErrorMiddleware = (err: ErrorHandler | Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorHandler) {
    const { statusCode, message } = err
    logger.error(`Error ${statusCode}: ${message}`)
    res.status(statusCode).json({
      statusCode,
      message,
      ...err.other
    })
  } else {
    logger.error(`Error de servidor ${err}`)
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    })
  }
}
