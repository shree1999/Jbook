import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localForage from 'localforage';

const fileCache = localForage.createInstance({
    name: 'jbook',
});

export const unpkgPathPlugin = () => {
    return {
        name: 'unpkg-path-plugin',
        setup(build: esbuild.PluginBuild) {
            build.onResolve(
                { filter: /.*/ },
                async (args: esbuild.OnResolveArgs) => {
                    console.info('On Resolve:');
                    console.log(args);

                    if (args.path === 'index.js') {
                        return { path: args.path, namespace: 'a' };
                    }

                    if (args.path.includes('./') || args.path.includes('../')) {
                        return {
                            namespace: 'a',
                            path: new URL(
                                args.path,
                                `https://unpkg.com${args.resolveDir}/`
                            ).href,
                        };
                    }

                    return {
                        namespace: 'a',
                        path: `https://unpkg.com/${args.path}`,
                    };
                }
            );

            build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
                console.info('On Load');
                console.log(args);

                if (args.path === 'index.js') {
                    return {
                        loader: 'jsx',
                        contents: `
                            const message = require("react");
                            console.log(message);
                        `,
                    };
                }

                const cachedData =
                    await fileCache.getItem<esbuild.OnLoadResult>(args.path);
                if (cachedData) {
                    return cachedData;
                }

                const { data, request } = await axios.get(args.path);
                const result: esbuild.OnLoadResult = {
                    loader: 'jsx',
                    contents: data,
                    resolveDir: new URL('./', request.responseURL).pathname,
                };

                await fileCache.setItem(args.path, result);
                return result;
            });
        },
    };
};
