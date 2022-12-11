import React, {useContext} from 'react';
import {IntlContext} from 'react-intl';

type Props = {
    iconName: string;
    onClick: () => void;
}

export default ({iconName, onClick}: Props) => {
    const {formatMessage} = useContext(IntlContext);
    const title = formatMessage({ id: `editorIconTitle_${iconName}` });
    return (
        <div className={`icon-${iconName}`} title={title} onClick={onClick} />
    );
}
