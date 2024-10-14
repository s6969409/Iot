import { NextFunction, Request, Response } from "express";
import { ErrorHandler, handleErrorMiddleware } from "./error_handler";

export async function customValidator(field: any) {
  //do anything
  if (!field) throw new Error('Custom message')
}

export async function successHandler(res: Response, result: object, statusCode: number = 200, tableParams: object = {}){
  res.status(statusCode).json({
    status: 'success',
    data: result,
    ...tableParams
  });
};

export async function doResultHandler(result: any, req: Request, res: Response, next: NextFunction) {
  if (result instanceof ErrorHandler) {
    handleErrorMiddleware(result, req, res, next)
  }
  else successHandler(res, result)
}
