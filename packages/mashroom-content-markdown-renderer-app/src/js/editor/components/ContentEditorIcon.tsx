import React, {useContext} from 'react';
import {IntlContext} from 'react-intl';

type Props = {
    iconName: string;
}

export default ({iconName}: Props) => {
    const {formatMessage} = useContext(IntlContext);
    const title = formatMessage({ id: `editorIconTitle_${iconName}` });
    return (
        <span className={`icon-${iconName}`} title={title}/>
    );
}
