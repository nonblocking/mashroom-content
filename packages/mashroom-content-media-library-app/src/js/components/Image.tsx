import React from 'react';

type Props = {
    url: string;
}

export default ({url}: Props) => {
    return (
        <div className="mashroom-content-media-library-asset-image" style={{backgroundImage: `url(${url})`}}/>
    );
};
