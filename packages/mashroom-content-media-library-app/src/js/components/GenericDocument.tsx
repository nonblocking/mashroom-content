import React from 'react';

const MIME_TYPE_MAPPING: Record<string, string> = {
    'application/pdf': 'icon-pdf',
    'application/msword': 'icon-word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'icon-wordprocessing',
    'application/vnd.oasis.opendocument.text': 'icon-wordprocessing',
    'application/vnd.apple.pages': 'icon-wordprocessing',
    'application/vnd.ms-excel': 'icon-spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'icon-spreadsheet',
    'application/vnd.oasis.opendocument.spreadsheet': 'icon-spreadsheet',
    'application/vnd.apple.numbers': 'icon-spreadsheet',
    'application/application/vnd.ms-powerpoint': 'icon-presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'icon-presentation',
    'application/vnd.oasis.opendocument.presentation': 'icon-presentation',
    'application/vnd.apple.keynote': 'icon-presentation',
    'application/x-gzip': 'icon-archive',
    'application/x-bzip': 'icon-archive',
    'application/x-bzip2': 'icon-archive',
    'application/zip': 'icon-archive',
    'application/x-7z-compressed': 'icon-archive',
    'application/vnd.rar': 'icon-archive',
    'audio/': 'icon-audio',
};

type Props = {
    mimeType: string;
}

export default ({mimeType}: Props) => {
    let iconClass;
    if (mimeType) {
        iconClass = MIME_TYPE_MAPPING[mimeType];
    }
    if (mimeType && !iconClass) {
        Object.keys(MIME_TYPE_MAPPING).forEach((mime) => {
            if (mimeType.indexOf(mime) === 0) {
                iconClass = MIME_TYPE_MAPPING[mime];
            }
        });
    }
    if (!iconClass) {
        iconClass = 'icon-file';
    }
    return (
        <div className="mashroom-content-media-library-asset-generic-document">
            <div className={iconClass} />
        </div>
    );
};
