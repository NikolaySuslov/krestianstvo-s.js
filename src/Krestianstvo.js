/*
The MIT License (MIT)
Copyright (c) 2022 Nikolay Suslov and the Krestianstvo.org project contributors.
(https://github.com/NikolaySuslov/krestianstvo/blob/master/LICENSE.md)
*/

import { default as S } from 's-js/dist/es/withsubclocks';
import { connect } from './ReflectorClient.js'
import { initTime } from './VirtualTime.js';
import Alea from 'alea/alea.js'
import { v4 as uuidv4 } from 'uuid';

const selos = {}

export const initSelo = (seloID, seloData) => {

    selos[seloID] ? selos[seloID] : selos[seloID] = {} 

    let clientSeloID = uuidv4();
    selos[seloID][clientSeloID] = { id: seloID }

    let selo = selos[seloID][clientSeloID]
    selo.app = seloData

    let path = { "loadInfo": {}, "path": { "application": "index.vwf", "instance": seloID, "public_path": "/" + seloID }, "user": "w" }

    const connection = connect(path, "app", selo, null)
    selo.connection = connection
    initTime(connection.socket, seloID, selo)


    selo.configuration = {
        "random-seed": +new Date
    }

    selo.prng = new Alea(selo.configuration["random-seed"]);

    selo.future = (msgName, value, when) => {

        if (when === undefined) {
            selo.app.msgs[msgName](value)
        } else {
            selo.virtualTime.plan('nodeID', msgName, undefined,
                [value], -1 * when, undefined /* result */);
        }
    }

    selo.sendExtMsg = (msgName, value, when, nodeID) => {

        let params = (Array.isArray(value)) ? value : [value]

        selo.virtualTime.send(selo.id, nodeID, msgName, undefined,
            params, when || 0, undefined /* result */);

    }


    selo.dispatchMsg = (nodeID, actionName, parameters) => {


        if (actionName == "createNode" && parameters[1] == "application") {
            console.log("App INIT")
            selo.app.ready(true)
        }

        if (actionName == "createNode" && parameters[0] == "proxy/clients.vwf") {
            console.log("create clients list")

        }

        if (actionName == "createChild" && parameters[0] == "proxy/clients.vwf") {
            console.log("add client")
            selo.app.appState.clients.push(parameters[1])
        }

        if (actionName == "deleteChild" && parameters[0] == "proxy/clients.vwf") {
            console.log("delete client");
            let index = selo.app.appState.clients().indexOf(parameters[1])
            selo.app.appState.clients().splice(index, 1);

            Object.keys(selo.app.appState).forEach(el => {
                if (el.includes(parameters[1]))
                    delete selo.app.appState[el]
            })
            if(selo.app.context)
                selo.app.drawAvatar()
        }

        if (actionName == 'getState') {
            return selo.getState()
        }

        if (actionName == 'setState') {
            console.log("SYNC!");
            selo.setState(parameters[0])
        }

        if (selo.app.msgs[actionName]) {
            selo.app.msgs[actionName](parameters)
        }
    }


    selo.setState = (res) => {

        let applicationState = res;

        if (applicationState.configuration) {
            selo.configuration = applicationState.configuration;
            selo.prng = new Alea(selo.configuration["random-seed"]);
            if (applicationState.prngState) {
                selo.prng.importState(applicationState.prngState);

            }
        }

        if (applicationState.kernel) {
            if (applicationState.kernel.time !== undefined) selo.virtualTime.now = applicationState.kernel.time;
        }

        if (applicationState.appState) {

            applicationState.appState.forEach((el) => {

                if (!selo.app.appState[el[0]]) {
                    selo.app.appState[el[0]] = S.data()
                }
                selo.app.appState[el[0]](el[1])
            })


            // Clear the message queue, except for reflector messages that arrived after the
            // current action.

            selo.virtualTime.filterQueue();

            // Set the queue time and add the incoming items to the queue.

            if (applicationState.queue) {
                selo.virtualTime.time = applicationState.queue.time;
                selo.virtualTime.insert(applicationState.queue.queue || []);
            }

            selo.app.ready(true)
        }
    }

    selo.getState = () => {

        let appState = Object.entries(selo.app.appState).map(([key, value]) => [key, S.sample(value)]);

        let applicationState = {

            configuration: selo.configuration,

            // Internal kernel state.

            kernel: {
                time: selo.virtualTime.now,
            },

            appState: appState,

            // Message queue.

            queue: selo.virtualTime.stateQueue(),
            prngState: selo.prng.exportState()


        };

        return applicationState
    }

    return selo
}





