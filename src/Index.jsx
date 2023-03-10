/*
The MIT License (MIT)
Copyright (c) 2023 Nikolay Suslov and the Krestianstvo.org project contributors.
(https://github.com/NikolaySuslov/krestianstvo/blob/master/LICENSE.md)
*/

import App from './App.jsx';
import { block, mount } from 'million';

const indexView = block(() => {
  return (
    <div>
      <h2>Krestianstvo | S.js</h2>
      <div
        style={{
          display: "grid",
          "grid-template-columns": "50% 50%",
          "grid-auto-rows": "1fr",
          gap: "0px 6px"
        }}
      >
        {new App("app1").initView()}
        {new App("app1").initView()}
        {new App("app3").initView()}
      </div>
    </div>
  )
})

const main = indexView();

mount(main, document.getElementById('root'))
