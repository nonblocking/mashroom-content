import React from 'react';

type Props = {
    url: string;
}

export default ({url}: Props) => {
    return (
        <div className="mashroom-content-media-library-asset-video">
            <video controls muted>
                <source src={url} />
            </video>
        </div>
    );
};
