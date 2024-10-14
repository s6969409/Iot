import { Router } from 'express'
//#import routers
import device from '@modules/device/routes';
//#endregion
const router = Router()

//importing all routes here
router.get('/', (req, res) => {
    return res.json({ hello: 'Wordl' });
})

router.use('/device', device);


export default router
