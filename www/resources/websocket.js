const websocket=(()=>{

    const sockets = {};
    let ajax = {};
    let aid = 1;
    const listeners=[];

    function wsAjax({ url, data, success, error, reconnect }) {
        let urls = url.split("/");
        if (urls.length != 2) throw new Error("urls for wsAjax must be like controller/action");
        if (!(urls[0] in sockets)) {
            function open(pending) {
                let path=location.pathname;
                let idx=path.lastIndexOf("/");
                if (idx>=0) {
                    path=path.substring(0,idx)+"/"
                }
                let socket = new WebSocket("ws" + location.origin.substring(4) + path + urls[0]);
                sockets[urls[0]] = {
                    socket,
                    pending
                };
                socket.addEventListener('open', (event) => {
                    console.log("websocket open");
                    let pendings = sockets[urls[0]].pending;
                    sockets[urls[0]].pending = [];
                    for (let i = 0; i < pendings.length; i++) {
                        wsAjax(pendings[i]);
                    }
                    if (reconnect) {
                        reconnect();
                    }
                });

                socket.addEventListener('close', (event) => {
                    console.log("websocket closed");
                    open(sockets[urls[0]].pending);
                });

                socket.addEventListener('error', (event) => {
                    console.log("websocket error");
                    websocket.ajaxDefault.error("", 0);
                });

                // Listen for messages
                socket.addEventListener('message', (event) => {
                    let d = JSON.parse(event.data);
                    if ("ajax" in d) {
                        let resp = ajax[d.ajax];
                        delete ajax[d.ajax];
                        if (!resp) return;
                        if ("error" in d) {
                            resp.error(d.error, d.status);
                        } else if ("success" in d) {
                            resp.success(d.success);
                        }
                    } else if ("broadcast" in d) {
                        for(let i=0; i<listeners.length; i++) {
                            if (listeners[i](d.broadcast)===false) break;
                        }
                    }
                });
            }
            open([arguments[0]])
        } else {
            let s = sockets[urls[0]].socket;
            if (s && s.readyState == "1") {
                let id = aid++;
                ajax[id] = { success: success || websocket.ajaxDefault.success, error: error || websocket.ajaxDefault.error };
                s.send(JSON.stringify({
                    ajax: id,
                    action: urls[1],
                    params: data
                }));
            } else {
                sockets[urls[0]].pending.push(arguments[0]);
            }
        }
    };

    function addBroadcastListener(fn) {
        listeners.push(fn);
    }

    function removeBroadcastListener(fn) {
        let idx=listeners.indexOf(fn);
        if (idx!=-1) listeners.splice(idx,1);
    }

    let websocket={
        ajax:wsAjax,
        addBroadcastListener,
        removeBroadcastListener,
        ajaxDefault:{
            success() {},
            error(msg) {console.error(msg)}
        }
    }

    return websocket;

})();