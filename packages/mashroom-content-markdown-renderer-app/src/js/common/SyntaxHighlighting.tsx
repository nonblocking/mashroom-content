import React from 'react';
import {PrismAsyncLight as SyntaxHighlighter} from 'react-syntax-highlighter';
import {darcula} from 'react-syntax-highlighter/dist/esm/styles/prism';

type Props = {
    language: string | undefined;
    code: string;
    className: string | undefined;
}

export default ({language, code, className}: Props) => {
    if (language) {
        return (
            <SyntaxHighlighter
                children={code}
                language={language}
                style={darcula}
                PreTag="div"
            />
        )
    }

    return (
        <code className={className}>
            {code}
        </code>
    )
};
