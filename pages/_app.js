import React from 'react';
import '../styles/globals.css';

export default function HawthorneStereoNews({ Component, pageProps }) {
    return (
        <React.StrictMode>
            <Component {...pageProps} />
        </React.StrictMode>
    );
}
