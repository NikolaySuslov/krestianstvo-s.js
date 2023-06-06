/*
The MIT License (MIT)
Copyright (c) 2023 Nikolay Suslov and the Krestianstvo.org project contributors. 
(https://github.com/NikolaySuslov/krestianstvo/blob/master/LICENSE.md)

Virtual World Framework Apache 2.0 license  
(https://github.com/NikolaySuslov/livecodingspace/blob/master/licenses/LICENSE_VWF.md)
*/

import { v4 as uuidv4 } from 'uuid';

const connections = {}

export const connect = function (path, storeID, seloData, hostURL) {

    const host = 'http://localhost:3001' //hostURL ? hostURL : conf.defaultReflectorHost
    let objToRef = path ? path : { "loadInfo": {}, "path": { "application": "index.vwf", "instance": "O4t2lsAgzKtJoxkH", "public_path": "/empty" }, "user": "w" }
    let moniker_ = uuidv4();
    let query = `pathname=w&appRoot=./public&moniker=` + moniker_ + `&path=` + JSON.stringify(objToRef)

    let url = host.includes('http:') ? host.replace("http", "ws") : host.includes('https') ? host.replace("https", "wss") : host

    const ws = new WebSocket(url + "/?" + query);

    seloData.moniker_ = moniker_

    const connection = {
        socket: ws
    }

    connection.disconnect = function () {
        console.log("Disconnecting...")
        connection.socket?.close();
    }

  ws.addEventListener("message", (event) => {

        try {
            var fields = JSON.parse(event.data);
            fields.time = Number(fields.time);
            fields.origin = "reflector";
            queueMicrotask(() => {
                seloData.virtualTime.insert(fields, !fields.action);
            })

        } catch (e) {
            console.log(fields.action, fields.node, fields.member, fields.parameters,
                "exception performing action: ", e)
        }

    });

    connections[storeID] = connection
    return connection
}