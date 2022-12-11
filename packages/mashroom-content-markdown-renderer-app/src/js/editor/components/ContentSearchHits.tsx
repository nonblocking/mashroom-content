import React from 'react';
import {useSelector} from 'react-redux';

import {FormattedMessage} from 'react-intl';
import type {MashroomContentApiContentWrapper} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {EditorState} from '../../types';

const MAX_CONTENT_PREVIEW_LENGTH = 100;

type Props = {
    hits: Array<MashroomContentApiContentWrapper<any>>;
    onOpen: (contentId: string) => void;
}

export default ({hits, onOpen}: Props) => {
    const {contentProp, titleProp} = useSelector((state: EditorState) => state.config);
    return (
        <div className="content-search-hits">
            {hits.map(({id, data}) => {
                const title = data[titleProp];
                let markdown = data[contentProp];
                if (markdown?.length > MAX_CONTENT_PREVIEW_LENGTH) {
                    markdown = `${markdown.substring(0, MAX_CONTENT_PREVIEW_LENGTH)}...`;
                }
                return  (
                    <div key={id} className="content-search-hit">
                        <div className="content-search-hit-title">
                            {title}
                        </div>
                        <div className="content-search-hit-content">
                            <pre>
                                {markdown}
                            </pre>
                        </div>
                        <div className="content-search-hit-select">
                            <a href="javascript:void(0)" onClick={() => onOpen(id)}>
                                <FormattedMessage id="select" />
                            </a>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
