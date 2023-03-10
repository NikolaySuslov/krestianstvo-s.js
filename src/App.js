/*
The MIT License (MIT)
Copyright (c) 2022 Nikolay Suslov and the Krestianstvo.org project contributors.
(https://github.com/NikolaySuslov/krestianstvo/blob/master/LICENSE.md)
*/

import { default as S } from 's-js/dist/es/withsubclocks';
import { default as SArray } from './lib/s-array/es/index.js';
import { m, patch} from 'million';
import { initSelo } from './Krestianstvo.js';


class App {

    constructor(id) {
        this.initialize(id)
    }

    initialize(id) {
        let self = this
        console.log("init app")

        this.ready = S.data(false)

        // app messages

        this.msgs = {
            "tick": S.data(),
            "inc": S.data(),
            "dec": S.data(),
            "incPlay": S.data(),
            "random": S.data(),
            "bgColor": S.data(),
            "mousePosition": SArray([])
        }

        // app state

        this.appState = {
            clients: SArray([]),
            counter: S.data(0),
            play: S.data(0),
            randomNumber: S.data(),
            initialized: S.data(false),
            bgColor: S.data("#fff")
        }


        this.dt = S.data(1 / 60);
        this.running = S.data(false);
        this.frame = S.data(0);

        //Initialize Selo and App

        this.selo = initSelo(id, this)
        //this.initView();
        self.startApp()

    }


    startApp() {
        console.log("start app")
        let self = this;

        S.root(() => {

            S.on(self.ready, () => {
                if (self.ready()) {
                    if (self.appState.initialized() == false) {
                        self.selo.future("incPlay", true);
                        self.appState.initialized(true)
                    }


                    self.appState.clients.map((el) => {
                        console.log("Avatar: ", el);

                        if (!self.appState[el + "_mouse"]) {
                            self.appState[el + "_mouse"] = S.data({ x: 0, y: 0 })
                        }

                        if (!self.appState[el + "_color"]) {
                            self.appState[el + "_color"] = S.data(self.randomColor())
                        }

                        S(() => {
                            if (self.appState[el + "_mouse"]()) {
                                if (!self.canvas) {
                                    let elID = self.appDivID + '_canvas'
                                    let el = document.getElementById(elID)
                                    self.canvas = el;
                                    self.context = el.getContext("2d");
                                    window.addEventListener('mousemove', self.drawOnCanvas.bind(self), false);
                                } else {
                                    self.drawAvatar()
                                }


                            }

                        })

                    })

                }
            })

            //Messages for changing appState

            S.on(self.msgs.bgColor, () => {
                self.selo.future("random", true);
                self.appState.bgColor(self.randomColor())
            }, null, true)


            S.on(self.msgs.tick, () => {
                let tick = self.msgs.tick();
                let elID = self.appDivID + '_tick'
                let el = document.getElementById(elID)
                const v = m('div', { id: elID }, [m('h3', {}, ["Tick: ", tick.toPrecision(4)])]);
                if (el)
                    patch(el, v);

            }, null, true)

            S.on(self.msgs.mousePosition, () => {
                let el = self.msgs.mousePosition()[0]
                let pos = { x: self.msgs.mousePosition()[1], y: self.msgs.mousePosition()[2] }
                let mouse = self.appState[el + '_mouse']
                if (mouse)
                    mouse(pos)
            }, null, true)


            S.on(self.msgs.random, () => {
                self.appState.randomNumber(self.selo.prng());
            }, null, true)


            S.on(self.msgs.incPlay, () => {
                self.appState.play(S.sample(self.appState.play) + 1);
                self.selo.future("incPlay", true, 0.3);
            }, null, true)

            S.on(self.msgs.inc, () => {
                self.appState.counter(S.sample(self.appState.counter) + 1);
                //self.selo.future("inc", true, 0.1);
            }, null, true)


            S.on(self.msgs.dec, () => {
                self.appState.counter(S.sample(self.appState.counter) - 1);
            }, null, true)

            // reactive view

            S(() => {
                let elID = self.appDivID
                let el = document.getElementById(elID)
                let color = self.appState.bgColor()
                if (el)
                    el.style.backgroundColor = color
            })

            S(() => {
                console.log(S.sample(self.appState.counter))
                let elID = self.appDivID + '_el2'
                let el = document.getElementById(elID)
                const v2 = m('div', { id: elID }, [m('h1', {}, [self.appState.counter().toString()])]);
                if (el)
                    patch(el, v2);
            })

            S(() => {
                //console.log(S.sample(self.appState.play))
                let elID = self.appDivID + '_playEl'
                let el = document.getElementById(elID)
                const v2 = m('div', { id: elID }, [m('h2', {}, [self.appState.play().toString()])]);
                if (el)
                    patch(el, v2);
            })

            self.running(true);
            // runner
            var prior = 0;
            let time = S.on(self.dt, t => t + self.dt(), 0);
            let frameTicker = t => { self.frame(t); requestAnimationFrame(frameTicker); };
            frameTicker(0);

            S(() => {
                if (!self.running()) return;
                if (prior) self.dt((self.frame() - prior) / 1000);
                prior = self.frame();
            });

            S.on(self.dt, () => {
                var _dt = self.dt();

                //view animation here

            }, null, true)
        }
        )
    }

    drawAvatar() {

        this.context.fillStyle = "rgba(255, 255, 255, 1)"
        this.context.font = '14px serif';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.appState.clients.forEach(el => {
            let avatarID = el
            let m = this.appState[el + '_mouse']
            let c = this.appState[el + '_color']

            if (m && c) {

                let pos = 'x: ' + m().x.toPrecision(4).toString() + ' y: ' + m().y.toPrecision(4).toString()
                //this.moniker_

                this.context.save();
                this.context.globalAlpha = 0.7;
                this.context.fillStyle = c();

                //this.context.fillRect(m().x, m().y, 30, 30);
                this.context.beginPath();
                this.context.arc(m().x, m().y, 20, 0, 2 * Math.PI);
                this.context.fill();
                this.context.stroke();
                this.context.restore();

                this.context.fillStyle = "#000";
                this.context.fillText(avatarID, m().x, m().y - 30);
                this.context.fillText(pos, m().x, m().y - 50);

            }
        })
    }

    initView() {
        let self = this;

        self.appDivID = self.randId()
        let containerDiv = m('div', { id: self.appDivID }, [
            m('p', {}, [m('a', { href: window.location.href, target: "_blank" }, [
                m('span', {}, ["Link to this World"])
            ])]),
            m('div', { id: self.appDivID + '_tick' }),
            m('button', {
                onclick: () => {
                    self.selo.sendExtMsg("inc", true)
                }
            }, [m('span', {}, "+")]),
            m('button', {
                onclick: () => {
                    self.selo.sendExtMsg("dec", true);
                }
            }, [m('span', {}, "-")]),
            m('div', { id: self.appDivID + '_el2' }, [m('h1', {}, [self.appState.counter().toString()])]),
            m('div', { id: self.appDivID + '_el3' }),
            m('div', { id: self.appDivID + '_playEl' }),
            m('canvas',
                {
                    id: self.appDivID + '_canvas',
                    width: 300,
                    height: 300,
                    style: "border:1px solid #000000;margin:0;padding:0;width:300px;height:300px"
                }
            ),
            m('div', {}, [m('button', {
                onclick: () => {
                    self.selo.sendExtMsg("bgColor", true);
                }
            }, [m('span', {}, "Random color")])])

        ])

        return containerDiv

    }

    drawOnCanvas(e) {
        let rect = this.canvas.getBoundingClientRect();
        let pos = this.getMousePos(this.canvas, e, rect);

        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom)
            this.selo.sendExtMsg("mousePosition", [this.selo.moniker_, pos.x, pos.y], 0, this.selo.moniker_)
    }


    getMousePos(canvas, evt, rect) {
        return {
            x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
            y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
        };
    }

    randId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    randomColor() {
        return "#" + Math.floor(parseFloat(this.appState.randomNumber(this.selo.prng())) * 16777215).toString(16)
    }

}

export default App