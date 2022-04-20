const ESLintPlugin = require("eslint-webpack-plugin");

module.exports = (env, argv) => {
    let entry;
    if (argv.mode !== 'production') {
        entry = [
            '@mashroom/mashroom-portal-default-theme/dist/public/portal.css',
            __dirname + '/src/js',
        ];
    } else {
        entry =__dirname + '/src/js';
    }

    return {
        entry,
        output: {
            path: __dirname + '/dist',
            filename: 'index.js',
        },
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'babel-loader'
                        },
                    ],
                },
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: 'style-loader',
                        },
                        {
                            loader: 'css-loader',
                        },
                    ],
                    sideEffects: true,
                },
                {
                    test: /\.scss$/,
                    use: [
                        {
                            loader: 'style-loader',
                        },
                        {
                            loader: 'css-loader',
                        },
                        {
                            loader: 'sass-loader',
                        },
                    ],
                    sideEffects: true,
                },
                {
                    test: /\.svg$/,
                    use: [
                        {
                            loader: 'svg-inline-loader',
                        },
                    ],
                }
            ],
        },
        resolve: {
            extensions: ['.js', '.ts', '.tsx'],
        },
        plugins: [
            new ESLintPlugin({
                extensions: ['.js', '.ts', '.tsx'],
                fix: true,
            })
        ],
        devServer: {
            host: '0.0.0.0',
            allowedHosts: 'all',
            port: 8088,
            static: 'test',
            open: true,
            client: {
                overlay: {
                    errors: true,
                    warnings: false,
                },
            }
        },
    };
};
