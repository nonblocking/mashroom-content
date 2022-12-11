import sharp from 'sharp';
import type {MashroomContentAssetProcImageConvert, MashroomContentAssetProcImageResize} from '../type-definitions';
import type {Duplex, Readable} from 'stream';

export default async (asset: Readable, defaultQuality: number, scaleUp: boolean, resize?: MashroomContentAssetProcImageResize, convert?: MashroomContentAssetProcImageConvert): Promise<Readable> => {
    if (!resize?.width && !resize?.height && !convert?.format) {
        return asset;
    }

    const procs: Array<Duplex> = [];
    if (convert?.format) {
        const {format, quality} = convert;
        procs.push(sharp().toFormat(format, {
            quality: quality || defaultQuality,
        }));
    }
    if (resize?.width || resize?.height) {
        const {width, height, fit = 'cover'} = resize;
        procs.push(sharp().resize(width, height, {
            withoutEnlargement: !scaleUp,
            fit,
        }));
    }

    return procs.reduce((stream, proc) => stream.pipe(proc), asset);
}
