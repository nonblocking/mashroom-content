
module.exports = {
    entry: __dirname + '/src/frontend/clientservice/index.ts',
    output: {
        path: __dirname + '/dist/public',
        filename: 'contentClientService.js'
    },
    target: ['web', 'es5'],
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                    },
                ],
            },
        ]
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
    },
};
