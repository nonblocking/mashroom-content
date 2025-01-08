import React from 'react';
import {FormattedMessage} from 'react-intl';

type Props = {
    src?: string;
    width?: string;
}

export default ({src, width}: Props) => {
    if (!src) {
       return (
           <strong>Error: Video src missing!</strong>
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
            <video autoPlay controls muted>
                <source src={src} />
                <FormattedMessage id="html5VideoNotSupported" />
            </video>
        </div>
    );
};
