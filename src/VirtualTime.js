/*
The MIT License (MIT)
Copyright (c) 2022 Nikolay Suslov and the Krestianstvo.org project contributors. 
(https://github.com/NikolaySuslov/krestianstvo/blob/master/LICENSE.md)

Virtual World Framework Apache 2.0 license  
(https://github.com/NikolaySuslov/livecodingspace/blob/master/licenses/LICENSE_VWF.md)
*/

import Heap from 'qheap/lib/qheap.js'

const datas = {}

export const initTime = (socket, storeID, seloData) => {

    const data = {
        socket: socket,
        owner: null,
        queue: new Heap({
            compar: queueSort
        }),
        now: 0,
        sequence_: undefined,
        client_: undefined,
        time: 0,
        suspension: 0,
        sequence: 0
    }

    data.insert = (fields, chronic) => {

        var messages = fields instanceof Array ? fields : [fields];

        messages.forEach((fields) => {
            fields.sequence = ++data.sequence; // track the insertion order for use as a sort key
            data.queue.insert(fields)
            if (chronic) {
                data.time = Math.max(data.time, fields.time); // save the latest allowed time for suspend/resume
            }
        });

        //Sort here (now in Heap)
        if (chronic) {
            data.dispatch();
        }

    }

    data.pull = () => {

        if (data.suspension == 0 && data.queue.size() > 0 && data.queue.peek().time <= data.time) {
            return data.queue.shift();
        }

    }

    data.filter = (callback /* fields */) => {

        let filtered = data.queue._list.slice().filter(callback);
        data.queue = new Heap({
            compar: queueSort
        });
        filtered.map(el => {
            data.queue.insert(el);
        });
    }

    data.filterQueue = () => {

        data.filter((fields) => {

            if ((fields.origin === "reflector") && fields.sequence > data.sequence_) {
                return true;
            } else {
                console.log("setState", "removing", JSON.stringify(fields), "from queue")
            }

        })
    }

    data.suspend = (why) => {

        if (data.suspension++ == 0) {
            console.log("-queue#suspend", "suspending queue at time", data.now, why ? why : "");
            return true;
        } else {
            console.log("-queue#suspend", "further suspending queue at time", data.now, why ? why : "");
            return false;
        }

    }

    data.resume = (why) => {

        if (--data.suspension == 0) {
            console.log("-queue#resume", "resuming queue at time", data.now, why ? why : "");
            data.dispatch();
            return true;
        } else {
            console.log("-queue#resume", "partially resuming queue at time", data.now, why ? why : "");
            return false;
        }

    }

    data.ready = () => {
        return data.suspension == 0;
    }

    data.stateQueue = () => {
        return {
            time: data.time,
            queue: transform(data.queue._list, data.queueTransitTransformation),
        }

    }

    data.receive = (seloID, nodeID, actionName, memberName, parameters, respond, origin, client) => {

        // Look up the action handler and invoke it with the remaining parameters.
        // Note that the message should be validated before looking up and invoking an arbitrary
        // handler.

        var args = [],
            result;

        if (nodeID || nodeID === 0) args.push(nodeID);
        if (memberName) args.push(memberName);
        if (parameters) args = args.concat(parameters); // flatten
        if (client) args.push(client);

        // Invoke the action.
        if (actionName == 'createChild') {
        }

        // Invoke the action.

        if (origin !== "reflector" || !nodeID || seloData.app.msgs[actionName] ) { 

           result = seloData.dispatchMsg(nodeID, actionName, parameters)

        } else {
            console.log("receive", "ignoring reflector action on non-existent node", nodeID)
            result = undefined;
        }
        // Return the result.

        respond && data.respond(nodeID, actionName, memberName, parameters, result);

    }

    data.dispatch = () => {

        var fields;

        // Actions may use receive's ready function to suspend the queue for asynchronous
        // operations, and to resume it when the operation is complete.

        while (fields = /* assignment! */ data.pull()) {

            // Advance time to the message time.

            if (data.now != fields.time) {
                data.sequence_ = undefined; // clear after the previous action
                data.client_ = undefined; // clear after the previous action
                data.now = fields.time;
                data.tock();
            }

            // Perform the action.

            if (fields.action) { // TODO: don't put ticks on the queue but just use them to fast-forward to the current time (requires removing support for passing ticks to the drivers and nodes)
                data.sequence_ = fields.sequence; // note the message's queue sequence number for the duration of the action
                data.client_ = fields.client; // ... and note the originating client
                data.receive(fields.seloID, fields.node, fields.action, fields.member, fields.parameters, fields.respond, fields.origin, fields.client);
            } else {
                data.tick();
            }

        }

        // Advance time to the most recent time received from the server. Tick if the time
        // changed.

        if (data.ready() && data.now != data.time) {
            data.sequence_ = undefined; // clear after the previous action
            data.client_ = undefined; // clear after the previous action
            data.now = data.time;
            data.tock();
        }

    }

    data.plan = (nodeID, actionName, memberName, parameters, when, callback_async /* ( result ) */) => {

        var time = when > 0 ? // absolute (+) or relative (-)
            Math.max(data.now, when) :
            data.now + (-when);

        var fields = {
            time: time,
            node: nodeID,
            action: actionName,
            member: memberName,
            parameters: parameters,
            client: data.client_, // propagate originating client
            origin: "future",
            // callback: callback_async,  // TODO
        };

        data.insert(fields);

    }

    data.send = (seloID, nodeID, actionName, memberName, parameters, when, callback_async /* ( result ) */) => {

        var time = when > 0 ? // absolute (+) or relative (-)
            Math.max(data.now, when) :
            data.now + (-when);

        // Attach the current simulation time and pack the message as an array of the arguments.

        var fields = {
            seloID: seloID,
            time: time,
            node: nodeID,
            action: actionName,
            member: memberName,
            parameters: parameters 
            // callback: callback_async,  // TODO: provisionally add fields to queue (or a holding queue) then execute callback when received back from reflector
        };

        // Send the message.
        var message = JSON.stringify(fields);
        data.socket.send(message);
    }

    data.respond = (nodeID, actionName, memberName, parameters, result) => {

        console.log("respond", nodeID, actionName, memberName, parameters && parameters.length, "...")

        // Attach the current simulation time and pack the message as an array of the arguments.

        var fields = {
            // sequence: undefined,  // TODO: use to identify on return from reflector?
            time: data.now,
            node: nodeID,
            action: actionName,
            member: memberName,
            parameters: parameters,
            result: result 
        };

        // Send the message.

        var message = JSON.stringify(fields);
        data.socket.send(message);
    }

    data.tick = () => {

        seloData.app.msgs.tick(data.now)

    };

    data.tock = () => {
        //don't use tock for now
    }

    data.getNow = () => {
        return data.now
    }


    data.queueTransitTransformation = (object, names, depth) => {

        if (depth == 0) {

            // Omit any private direct messages for this client, then sort by arrival order
            // (rather than by time) so that messages will retain the same arrival order when
            // reinserted.

            return object.filter(el => el !== 0).filter((fields) => {
                return !(fields.origin === "reflector" && fields.sequence > data.sequence_) && fields.action; // TODO: fields.action is here to filter out tick messages  // TODO: don't put ticks on the queue but just use them to fast-forward to the current time (requires removing support for passing ticks to the drivers and nodes)
            }).sort(function (fieldsA, fieldsB) {
                return fieldsA.sequence - fieldsB.sequence;
            });

        } else if (depth == 1) {

            // Remove the sequence fields since they're just local annotations used to keep
            // messages ordered by insertion order and aren't directly meaniful outside of this
            // client.

            var filtered = {};

            Object.keys(object).filter(function (key) {
                return key != "sequence";
            }).forEach(function (key) {
                filtered[key] = object[key];
            });

            return filtered;

        }

        return object;
    }

    datas[storeID] = data
    seloData.virtualTime = data

    return data
}

const queueSort = (a, b) => {

    // Sort by time, then future messages ahead of reflector messages, then by sequence.
    // 
    // The sort by origin ensures that the queue is processed in a well-defined order
    // when future messages and reflector messages share the same time, even if the
    // reflector message has not arrived at the client yet.
    // 
    // The sort by sequence number ensures that the messages remain in their arrival
    // order when the earlier sort keys don't provide the order.

    // Execute the simulation through the new time.

    // To prevent actions from executing out of order, callers should immediately return
    // to the host after invoking insert with chronic set.


    if (a.time != b.time) {
        return a.time - b.time;
    } else if (a.origin != "reflector" && b.origin == "reflector") {
        return -1;
    } else if (a.origin == "reflector" && b.origin != "reflector") {
        return 1;
    } else {
        return a.sequence - b.sequence;
    }

}

const data = (id) => {
    return datas[id]
}


const transform = (object, transformation /* ( object, names, depth, finished ) */, names, depth) => {

    names = names || [];
    depth = depth || 0;

    var finished = false, item;

    var result = object = transformation(object, names, depth, function () { finished = true });

    if (typeof object === "object" && object !== null && !finished) {

        if (object instanceof Array) {

            // Recursively transform the elements if the object is an Array.

            for (var index = 0; index < object.length; index++) {

                if ((item = transform(object[index], transformation,
                    [index].concat(names), depth + 1)) !== object[index]) {

                    // If the item changed, and it's the first change in the array, then
                    // duplicate the array.

                    if (result === object) {
                        result = [].concat(object);  // shallow copy into a new Array
                    }

                    // Assign the transformed item.

                    result[index] = item;
                }
            }

        } else {

            // Recursively transform the properties if the object is an Object.

            Object.keys(object).forEach((key) => {

                if ((item = transform(object[key], transformation,
                    [key].concat(names), depth + 1)) !== object[key]) {

                    // If the item changed, and it's the first change in the object, then
                    // duplicate the object.

                    if (result === object) {

                        result = {};

                        Object.keys(object).forEach((k) => {
                            result[k] = object[k];  // shallow copy into a new Object
                        });

                        // Also copy the non-enumerable `length` property for an `arguments`
                        // object.

                        var lengthDescriptor = Object.getOwnPropertyDescriptor(object, "length");

                        if (lengthDescriptor && !lengthDescriptor.enumerable) {
                            Object.defineProperty(result, "length", lengthDescriptor);
                        }

                    }

                    // Assign the transformed item.

                    result[key] = item;
                }

            });

        }

    }

    return result;
}
