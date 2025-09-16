import { Request, Response, NextFunction } from 'express';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    //current stamp in iso formart
      console.log(`[${new Date().toISOString}] ${req.method} ${req.url}`);    
    //fro moving to the next request
    next();
}