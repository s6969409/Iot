import { Router } from 'express'
import { storeValidators, updateValidators } from './validator'
import { Controller, getInfo, sendCmd } from './controller'
import { validateBody } from '@middlewares/validator'

const router = Router()

router.get('/', Controller.index)
//
router.get('/:id', Controller.show)
//
router.post('/', [...storeValidators, validateBody], Controller.store)
//
router.put('/', [...updateValidators, validateBody], Controller.update)
//
router.delete('/:id', Controller.destroy)
//
router.post('/info', getInfo)
router.post('/cmd', sendCmd)


export default router
