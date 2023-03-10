/*
The MIT License (MIT)
Copyright (c) 2022 Nikolay Suslov and the Krestianstvo.org project contributors.
(https://github.com/NikolaySuslov/krestianstvo/blob/master/LICENSE.md)
*/

import App from './App.js';
import { render, m, style} from 'million';

let vNode = m('div', {}, [
    m('h2', {}, ["Krestianstvo | S.js"]),
    m('div', { style: style({
        display: "grid",
        "grid-template-columns": "50% 50%",
        "grid-auto-rows": "1fr",
        gap: "0px 6px"
    }) }, [
        new App("app1").initView(),
        new App("app1").initView(),
        new App("app2").initView()
    ])
])

render(document.body, vNode);