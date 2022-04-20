import React from 'react';
import type {ReactNode} from 'react';

type Props = {
    id?: string;
    href?: string;
    target?: string;
    gotoId?: string;
    children?: ReactNode;
}

export default ({id, href, target, gotoId, children}: Props) => {
    // Open absolute URLs always in another tab
    if (!target && href && (href.indexOf('http://') === 0 || href.indexOf('https://') === 0)) {
        target = '_blank';
    }
    let onClick = () => { /* do nothing */ };
    if (href) {
        onClick = () => global.open(href, target);
    } else if (gotoId) {
        onClick = () => (global as any).__mashroomContentGotoId(gotoId);
    }

    return (
        <button
            id={id}
            onClick={onClick}
        >
            {children}
        </button>
    );
};
