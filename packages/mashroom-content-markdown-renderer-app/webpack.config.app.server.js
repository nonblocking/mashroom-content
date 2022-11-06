
const {merge} = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const common = require('./webpack.config.app.common');

module.exports = merge(common,  {
    entry: __dirname + '/src/js/app/indexSSR',
    output: {
        path: __dirname + '/dist',
        filename: 'app-ssr.js',
        library: {
            type: 'commonjs',
        },
    },
    externals: [nodeExternals({
        // ES modules, cannot be required()
        allowlist: [
            /^mdast-/, /^unist-/, /^remark-/, /^markdown-/, /^micromark/, /^vfile/, /^is-/,
            'react-markdown', 'unified', 'bail', 'trough',  'escape-string-regexp', 'decode-named-character-reference',
            'character-entities', 'property-information', 'hast-util-whitespace', 'space-separated-tokens',
            'comma-separated-tokens', 'ccount', 'parse-entities', 'character-entities-legacy', 'character-reference-invalid',
            'stringify-entities', 'character-entities-html4', 'hastscript', 'hast-util-parse-selector', 'trim-lines',
            /^react-syntax-highlighter/,
        ],
    })],
    target: 'node',
    mode: 'none'
});
