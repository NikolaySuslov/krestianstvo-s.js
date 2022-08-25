/*
The MIT License (MIT)
Copyright (c) 2022 Nikolay Suslov and the Krestianstvo.org project contributors.
(https://github.com/NikolaySuslov/krestianstvo/blob/master/LICENSE.md)
*/

import App from './App.js';
import { createElement, m } from 'million';

document.body.appendChild(
    createElement(
        m('div', {}, [m('h2', {}, ["Krestianstvo | S.js"])])
        )
    )

new App("app1")
new App("app1")  
new App("app2") 