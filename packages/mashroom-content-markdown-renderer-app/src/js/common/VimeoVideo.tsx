import React from 'react';

type Props = {
    id?: string;
    privateKey?: string;
    width?: string;
}

export default ({id, privateKey, width}: Props) => {
    if (!id) {
       return (
           <strong>Error: Vimeo video ID missing!</strong>
       );
    }

    let wrapperStyle = {};
    if (width) {
        wrapperStyle = {
            width,
            maxWidth: '100%',
        };
    }

    return (
        <div style={wrapperStyle}>
            <div className="responsive-iframe-video-container">
                <iframe
                    src={`https://player.vimeo.com/video/${id}${privateKey ? `?h=${privateKey}` : ''}`}
                    frameBorder={0}
                    width={480}
                    height={270}
                    allowFullScreen
                />
            </div>
        </div>
    )
};
