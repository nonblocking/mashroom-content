
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';

import remarkDirectiveRehype from 'remark-directive-rehype';

import Anchor from './Anchor';
import Button from './Button';
import ResponsiveImage from './ResponsiveImage';
import SyntaxHighlighting from './SyntaxHighlighting';
import LocalVideo from './LocalVideo';
import YoutubeVideo from './YoutubeVideo';
import VimeoVideo from './VimeoVideo';
import prefixStyleRules from './prefixStyleRules';

type Props = {
    markdown: string;
    style: string | undefined | null;
    cssPrefixClass: string;
    belowFold: boolean;
    fullscreenImageOnClick: boolean;
    imageBreakpoints: Array<number>;
    imagePreferredFormats: Array<string>;
}

export default ({markdown, style, cssPrefixClass, belowFold, fullscreenImageOnClick, imageBreakpoints, imagePreferredFormats}: Props) => {

    return (
        <div className={`mashroom-content-markdown-wrapper ${cssPrefixClass}`}>
            {style && (
                <style dangerouslySetInnerHTML={{__html: prefixStyleRules(cssPrefixClass, style)}} />
            )}
            <ReactMarkdown
                remarkPlugins={[
                    remarkDirective,
                    remarkDirectiveRehype,
                    remarkGfm,
                ]}
                components={{
                    a: (props) => (
                        <Anchor {...props} />
                    ),
                    button: (props) => (
                        <Button {...props} />
                    ),
                    img: (props) => (
                        <ResponsiveImage
                            imgProps={props}
                            belowFold={belowFold}
                            fullscreenImageOnClick={fullscreenImageOnClick}
                            imageBreakpoints={imageBreakpoints}
                            imagePreferredFormats={imagePreferredFormats}
                        />
                    ),
                    code({className, children}) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match?.[1];
                        const code = String(children).replace(/\n$/, '');
                        return (
                            <SyntaxHighlighting code={code} language={language} className={className} />
                        );
                    },
                    video({src, width}) {
                        return (
                            <LocalVideo src={src} width={width as any} />
                        );
                    },
                    // @ts-ignore
                    youtube(props) {
                        return (
                            <YoutubeVideo {...props} />
                        );
                    },
                    // @ts-ignore
                    vimeo(props) {
                        return (
                            <VimeoVideo {...props} />
                        );
                    }
                }}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    );
};
