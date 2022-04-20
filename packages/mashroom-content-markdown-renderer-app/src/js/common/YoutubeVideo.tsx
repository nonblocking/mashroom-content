import React from 'react';

type Props = {
    id?: string;
    width?: string;
}

export default ({id, width}: Props) => {
    if (!id) {
       return (
           <strong>Error: Youtube video ID missing!</strong>
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
                    src={`https://www.youtube.com/embed/${id}`}
                    frameBorder={0}
                    width={480}
                    height={270}
                    allowFullScreen
                />
            </div>
        </div>
    )
};
