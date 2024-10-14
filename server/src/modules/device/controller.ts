import { NextFunction, Request, Response } from 'express'
import { DevService, sendDataToServer } from './services'
import { doResultHandler } from '@middlewares/express_validators'
import { ErrorHandler } from '@middlewares/error_handler'

export class MongoDBBaseController {
  protected service: any
  constructor(service) { this.service = service }
  /**
   * Return all entities
   * @param req
   * @param res
   * @param next
   */
  index = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await this.service.findAll()
    doResultHandler(result, req, res, next)
  }

  /**
   * Return one instance of entity
   * @param req
   * @param res
   * @param next
   */
  show = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params
    const result = await this.service.findOne(id)
    doResultHandler(result, req, res, next)
  }

  /**
   * Save an entity
   * @param req
   * @param res
   * @param next
   */
  store = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await this.service.store(req.body)
    doResultHandler(result, req, res, next)
  }

  /**
   * Update an entity
   * @param req
   * @param res
   * @param next
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await this.service.update(req.body)
    doResultHandler(result, req, res, next)
  }

  /**
   * Destroy one instance of an entity
   * @param req
   * @param res
   * @param next
   */
  destroy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params
    const result = await this.service.destroy(id)
    doResultHandler(result, req, res, next)
  }

}
export const Controller = new MongoDBBaseController(DevService)

async function sendToAllServers(devs) {
  try {
    // 創建一個包含所有請求的 Promise 陣列
    const promises = devs.map(dev => {
      const { ip, port, cmds } = dev;
      const command = JSON.stringify({ ...cmds, getLocalTime: null });

      return sendDataToServer(ip, port, command)
        .then(response => {
          return { ...dev, cmds: response }
        }).catch(err => {
          return { ...dev, error:err}
        })
      
    })

    const results = await Promise.all(promises)
    if(results.some(r=>'error' in r)){
      return new ErrorHandler(400, 'Error', {err:results});
    }else return results
    
    
  } catch (error) {
    console.error('Error occurred:', error)
  }
}

export const getInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const result = await sendToAllServers(req.body)
  doResultHandler(result, req, res, next)
}

export const sendCmd = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {ip,port,cmds} = req.body
  const command = JSON.stringify(cmds);
  const f= sendDataToServer(ip,port,command)
  .then(response => {
    return { ...req.body, cmds: response }
  }).catch(err => {
    return new ErrorHandler(400, err);
  })
  const result = await f
  doResultHandler(result, req, res, next)
}