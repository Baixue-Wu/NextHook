// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import './index.css';

import './i18n';

import store, { persistor } from './app/store'
import { Provider } from 'react-redux'

import { Suspense, lazy } from 'react';
import { NextHook } from './nexthook/NextHook';
import { WorkbenchBanner } from './nexthook/WorkbenchBanner';
const Workbench = lazy(() => import('./app/App').then(m => ({default: m.AppFC})));
const showCreator = window.location.pathname === '/' && !window.location.search.includes('session=');

import { PersistGate } from 'redux-persist/integration/react'
import { createRoot } from 'react-dom/client';


if (showCreator) document.documentElement.classList.add('nexthook-page');

const domNode = document.getElementById('root') as HTMLElement;
const root = createRoot(domNode);


root.render(<React.StrictMode>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                {showCreator ? <NextHook /> : <div style={{height:"100%",display:"flex",flexDirection:"column"}}><WorkbenchBanner /><div style={{position:"relative",flex:1,minHeight:0}}><Suspense fallback={<p>正在加载自由分析工作台…</p>}><Workbench /></Suspense></div></div>}
            </PersistGate>
        </Provider>
</React.StrictMode>);
