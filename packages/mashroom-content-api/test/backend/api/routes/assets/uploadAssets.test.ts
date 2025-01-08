
import {resolve} from 'path';
import uploadAsset from '../../../../../src/backend/api/routes/assets/uploadAsset';

const mockUploadAsset = jest.fn();

const pluginContext: any = {
    loggerFactory: () => console,
    services: {
        content: {
            service: {
                uploadAsset: mockUploadAsset,
            },
        }
    }
};

describe('uploadAsset', () => {

    beforeEach(() => {
        mockUploadAsset.mockReset();
    });

    it('searches content and rewrite asset URLs', async () => {
        let jsonResponse = undefined;
        mockUploadAsset.mockReturnValue({
            url: '/content/assets/proxy1/sdfjklsdjfkldsjfl_mashroom_portal_ui.png',
            meta: {
                whatever: 2
            }
        });

        const req: any = {
            pluginContext,
            body: {
                path: '/my-uploads',
                contentRefType: 'mediaLibrary',
                contentRefId: '123456',
                contentRefFieldName: 'file',
            },
            file: {
                path: resolve(__dirname, '../../../../assets/mashroom_portal_ui.png'),
                originalname: 'mashroom_portal_ui.png',
                mimetype: 'image/png',
                size: 1234,
            }
        };
        const res: any = {
            json: (json: any) => jsonResponse = json,
        };

        await uploadAsset(req, res);

        expect(mockUploadAsset.mock.calls[0][2]).toEqual({
            fileName: 'mashroom_portal_ui.png',
            height: 966,
            mimeType: 'image/png',
            size: 1234,
            title: 'mashroom_portal_ui.png',
            width: 1477
        });
        expect(mockUploadAsset.mock.calls[0][3]).toBe('/my-uploads');
        expect(mockUploadAsset.mock.calls[0][4]).toEqual({
            type: 'mediaLibrary',
            id: '123456',
            fieldName: 'file',
        });
        expect(jsonResponse).toEqual({
            url: '/content/assets/proxy1/sdfjklsdjfkldsjfl_mashroom_portal_ui.png',
            meta: {
                whatever: 2
            }
        });
    });

});
