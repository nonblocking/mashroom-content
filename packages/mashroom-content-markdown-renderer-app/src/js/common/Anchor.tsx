import React from 'react';
import type {ReactNode} from 'react';

type Props = {
    id?: string;
    href?: string;
    target?: string;
    title?: string;
    gotoId?: string;
    children?: ReactNode;
}

export default ({id, href, target, title, gotoId, children}: Props) => {
    let fixedHref = href;
    if (gotoId) {
        fixedHref = `javascript:__mashroomContentGotoId('${gotoId}')`;
    }
    if (!fixedHref) {
        fixedHref = 'javascript:void(0)';
    }
    // Open absolute URLs always in another tab
    if (!target && href && (href.indexOf('http://') === 0 || href.indexOf('https://') === 0)) {
        target = '_blank';
    }

    return (
        <a
            id={id}
            href={fixedHref}
            target={target}
            title={title}
        >
            {children}
        </a>
    );
};
