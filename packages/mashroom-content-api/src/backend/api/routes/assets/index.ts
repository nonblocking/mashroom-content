
import { Router } from 'express';
import multer from 'multer';
import searchAssets from './searchAssets';
import uploadAsset from './uploadAsset';
import removeAsset from './removeAsset';
import getAsset from './getAsset';

export default (uploadTmpDir: string): Router => {
    const router = Router();
    const uploadMiddleware = multer({ dest: uploadTmpDir });

    router.post('/', uploadMiddleware.single('file'), uploadAsset);
    router.get('/', searchAssets);
    router.delete('/:id', removeAsset);
    router.get('/*', getAsset);

    return router;
};
