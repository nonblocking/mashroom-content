import React, {useState} from 'react';

import type {ImgHTMLAttributes, SourceHTMLAttributes} from 'react';
import OverlayImage from './OverlayImage';

const DIMENSION_METADATA_IN_HASH = /(\d+)x(\d+)/;

const createImageUrl = (src: string, format: string | undefined, width: number | undefined) => {
    const query = [];
    if (format) {
        query.push(`_format=${format}`);
    }
    if (width) {
        query.push(`_w=${width}`);
    }

    const [url, hash] = src.split('#');
    if (url.indexOf('?') !== -1) {
        return `${url}&${query.join('&')}${hash ? `#${hash}` : ''}`;
    }
    return `${url}?${query.join('&')}${hash ? `#${hash}` : ''}`;
}

type Props = {
    imgProps: ImgHTMLAttributes<HTMLImageElement>;
    belowFold: boolean;
    fullscreenImageOnClick: boolean;
    imageBreakpoints: Array<number>;
    imagePreferredFormats: Array<string>;
}

export default ({imgProps, belowFold, fullscreenImageOnClick, imageBreakpoints, imagePreferredFormats}: Props) => {
    const [showOverlay, setShowOverlay] = useState(false);
    let responsive = imageBreakpoints?.length && imgProps.src && imgProps.src.indexOf('.svg') === -1;

    const processedImgProps: ImgHTMLAttributes<HTMLImageElement> = {
        src: imgProps.src,
        alt: imgProps.alt,
        width: imgProps.width,
        height: imgProps.height,
    };
    const title = imgProps.title;
    let className = imgProps.className;
    let onClickHandler;

    if (imgProps.src && imgProps.src.indexOf('#') !== -1) {
        // Check if width x height is given in the hash
        const hash = imgProps.src.split('#')[1];
        const match = hash.match(DIMENSION_METADATA_IN_HASH);
        if (match?.length === 3) {
            processedImgProps.width = match[1];
            processedImgProps.height = match[2];
        }
    }

    const smallImage = processedImgProps.width && imageBreakpoints.length > 0 && processedImgProps.width < imageBreakpoints[0];

    if (responsive && smallImage) {
        // Small images don't have to be responsive
        responsive = false;
    }

    if (belowFold) {
        processedImgProps.loading = 'lazy';
    }

    if (fullscreenImageOnClick && !smallImage) {
        className = `${className || ''} clickable-picture`;
        onClickHandler = () => setShowOverlay(true);
    }

    if (responsive) {
        const altSources: Array<SourceHTMLAttributes<HTMLSourceElement>> = [];
        const originalSrc = processedImgProps.src;
        const widths = imageBreakpoints.length > 0 ? [...imageBreakpoints] : [undefined];
        const formats = [...imagePreferredFormats, undefined];
        if (originalSrc && (widths.length > 1 || formats.length > 1)) {
            formats.forEach((format) => {
                let type;
                if (format) {
                    type = `image/${format}`;
                }
                const srcSet: Array<string> = [];
                widths.forEach((preferredWith) => {
                    const src = createImageUrl(originalSrc, format, preferredWith);
                    srcSet.push(`${src}${preferredWith ? ` ${preferredWith}w` : ''}`);
                });
                altSources.push(
                    <source key={format ?? 'default'} srcSet={srcSet.join(', ')} type={type}/>
                );
            });
        }

        return (
            <>
                <picture className={className} title={title} onClick={onClickHandler}>
                    <>
                        {altSources}
                        <img {...processedImgProps} />
                    </>
                </picture>
                {fullscreenImageOnClick && <OverlayImage src={imgProps.src} show={showOverlay} onClose={() => setShowOverlay(false)}/>}
            </>
        );
    }

    return (
        <>
            <img className={className} title={title} onClick={onClickHandler} {...processedImgProps} />
            {fullscreenImageOnClick && <OverlayImage src={imgProps.src} show={showOverlay} onClose={() => setShowOverlay(false)}/>}
        </>
    )
};
