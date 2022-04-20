
import { Router } from 'express';
import bodyParser from 'body-parser';
import searchContent from './searchContent';
import searchContentPost from './searchContentPost';
import getContent from './getContent';
import getContentVersions from './getContentVersions';
import insertContent from './insertContent';
import removeContent from './removeContent';
import updateContent from './updateContent';

export default (): Router => {
    const router = Router();
    router.use(bodyParser.json());

    router.get('/:type', searchContent);
    router.post('/:type/searches', searchContentPost);
    router.post('/:type', insertContent);

    router.get('/:type/:id', getContent);
    router.get('/:type/:id/versions', getContentVersions);
    router.put('/:type/:id', updateContent);
    router.delete('/:type/:id', removeContent);

    return router;
};
