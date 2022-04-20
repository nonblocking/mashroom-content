
import { Router } from 'express';
import api from './api';
import assets from './assets';

export default (uploadTmpDir: string): Router => {
    const router = Router();

    router.use('/api', api());
    router.use('/assets', assets(uploadTmpDir));

    return router;
};
