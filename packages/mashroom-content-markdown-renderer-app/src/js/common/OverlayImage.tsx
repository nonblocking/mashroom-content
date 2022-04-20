import React, {useEffect, useCallback} from 'react';
import {createPortal} from 'react-dom';

type Props = {
    src: string | undefined;
    show: boolean;
    onClose: () => void;
}

export default ({src, show, onClose}: Props) => {
    const onEscCb = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);
    useEffect(() => {
        if (show) {
            global.document.addEventListener('keydown', onEscCb);
        } else {
            global.document.removeEventListener('keydown', onEscCb);
        }
    }, [show]);

    if (!global.document?.body) {
        // SSR
        return null;
    }

    return createPortal(
        <div className="mashroom-content-markdown-renderer-app mashroom-content-markdown-renderer-app-config-editor" style={{ padding: 0 }}>
            <div className="mashroom-content-markdown-wrapper">
                <div className={`image-overlay ${show ? 'show' : ''}`} onClick={onClose}>
                    <img src={src} />
                </div>
            </div>
        </div>,
        document.body,
    );
};
