import { ErrorHandler } from '@middlewares/error_handler';
import net from 'net'
import { Document, model, Model, Schema } from 'mongoose';

export interface IDev extends Document {
  ip: string
  port: number
  cmds: Object
  mac: string
  desc: string
}

const devSchema = new Schema<IDev>({
  ip: { type: String, required: true, unique: true },
  port: {type: Number, required: true},
  cmds: {type:Object},
  mac: {type: String},
  desc: {type: String, required: true}
},{versionKey:false})

const Devs = model<IDev>('devs', devSchema);

var connections:string[] = [];

export function sendDataToServer(ip, port, data): Promise<Object>  {
  return new Promise((resolve, reject) => {
    //#region Record connections
    const key = `${ip}:${port}`
    if(connections.includes(key))
      reject(`A connection is already in progress for ${ip}:${port}`)
    connections = [...connections, key]

    //#endregion

    let client = new net.Socket()
    
    // 設置連接超時
    client.setTimeout(5000)

    client.on('data', (response) => {
      // 接收到數據後解析並返回
      client.destroy()
      connections = connections.filter(cn=>cn!=key)
      resolve(JSON.parse(response.toString()))
    })

    client.on('timeout', () => {
      // 超時處理
      client.destroy()
      connections = connections.filter(cn=>cn!=key)
      reject('Connection timed out')
    })

    client.on('error', (err) => {
      // 處理錯誤
      client.destroy()
      connections = connections.filter(cn=>cn!=key)
      reject(err)
    })

    client.on('close', () => {
      client.destroy()
      connections = connections.filter(cn=>cn!=key)
      reject('close')
    })

    client.on('end', () => {
      connections = connections.filter(cn=>cn!=key)
      reject('end')
    });

    

    client.connect(port, ip, () => {
      // 發送資料
      console.log('Send',data)
      client.write(data)
    })
  })
}

export class MongoDBBaseService<T> {
  protected model: Model<T>
  protected validator
  constructor(model: Model<T>, validator = data => data) {
    this.model = model
    this.validator = validator
  }
  findOne = async (_id: string): Promise<Object> => {
    try {
      const foundData = await this.model.findOne({ _id });

      if (foundData) {
        return foundData;
      } else {
        return new ErrorHandler(400, '找不到符合條件的資料。');
      }
    } catch (error: any) {
      return new ErrorHandler(400, '查詢資料時發生錯誤。', { id: error.name, message: error.message });
    }
  }

  findAll = async (): Promise<ErrorHandler | Object> => {
    try {
      const allData = await this.model.find();
      return allData;
    } catch (error: any) {
      return new ErrorHandler(400, '查詢所有資料時發生錯誤。', { name: error.name, message: error.message });
    }
  }

  update = async (body): Promise<Object> => {
    try {
      const data = await this.validator(body)
      if (data instanceof Error) return data;
      const updatedData = await this.model.findOneAndUpdate(
        { _id: body._id },
        data,
        { new: true }
      );

      if (updatedData) {
        return updatedData;
      } else {
        return new ErrorHandler(400, '找不到符合條件的資料。');
      }
    } catch (error: any) {
      return new ErrorHandler(400, '更新資料時發生錯誤。', { name: error.name, message: error.message });
    }
  }

  store = async (body: T | T[]): Promise<Object> => {
    try {
      if (Array.isArray(body)) {
        const data = body.map(t => this.validator(t))
        return await this.model.insertMany(data)
      } else {
        const data = await this.validator(body)
        return await this.model.create(data);
      }
    } catch (error: any) {
      return new ErrorHandler(400, '儲存資料時發生錯誤。', { name: error.name, message: error.message });
    }
  }

  destroy = async (_id: string): Promise<Object> => {
    try {
      const deletedData = await this.model.findOneAndDelete({ _id })
      if (deletedData) {
        return deletedData;
      } else {
        return new ErrorHandler(400, '找不到符合條件的資料。')
      }
    } catch (error: any) {
      return new ErrorHandler(400, '刪除資料時發生錯誤。', { name: error.name, message: error.message })
    }
  }
}

export const DevService = new MongoDBBaseService(Devs)