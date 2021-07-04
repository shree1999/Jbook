import React, { useEffect, useState } from 'react';
import * as esbuild from 'esbuild-wasm';

import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';

export const App: React.FC = () => {
    const [userInput, setUserInput] = useState('');
    const [code, setCode] = useState('');
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const initializeEsBuild = async () => {
            try {
                if (!initialized) {
                    await esbuild.initialize({
                        wasmURL: '/esbuild.wasm',
                        worker: true,
                    });

                    setInitialized(true);
                }
            } catch (err) {
                console.error(err.message);
            }
        };
        initializeEsBuild().then(() => {
            console.log('esbuild is initialized');
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onClickHandler = async () => {
        try {
            const res = await esbuild.build({
                entryPoints: ['index.js'],
                bundle: true,
                write: false,
                plugins: [unpkgPathPlugin()],
                define: {
                    'process.env.NODE_ENV': '"production"', // replace the value with string production
                    global: 'window',
                },
            });

            setCode(res.outputFiles[0].text);
        } catch (err) {
            console.error(err.message);
        }
    };

    return (
        <div>
            <h1>React Jbook Application</h1>
            <div>
                <textarea
                    rows={20}
                    cols={60}
                    onChange={(e) => setUserInput(e.target.value)}
                    value={userInput}
                />
            </div>
            <button onClick={onClickHandler}>Submit</button>

            <pre>{code}</pre>
        </div>
    );
};
