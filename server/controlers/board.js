module.exports = ({ HTTPError, model, user, assert, send, broadcast, addListener, removeListener, enableWebSocketMode, ws }) => {
    enableWebSocketMode();

    assert(() => {
        if (user.validated !== true) throw new HTTPError("Access Denied", 403)
    });

    let conversations = {};

    function isAuthorized(chat) {
        let authorized = false;
        if (user.superadmin === true) {
            return true; // accept everything
        } else if (user.admin === true) {
            if (chat.startsWith("g")) {
                let task_id = chat.substring(1);
                let task = model.groups.getTaskById(task_id);
                if (task == null) return true; // deleted, give access
                let universe = model.groups.getUniverseWithAccessRight(task.group_id, user.user_id);
                if (universe != null) {
                    authorized = true; // accept for now, will check for own universe later
                } else {
                    universe = model.groups.getUniverse(task.group_id);
                    if (universe == null) authorized = true; // deleted group, give access
                }
            } else if (chat.startsWith("t")) {
                let te_id = chat.substring(1);
                let universe = model.universes.getByTimeEntryWithAccessRight(te_id, user.user_id);
                if (universe != null) {
                    authorized = true; // accept for now, will check for own universe later
                } else {
                    universe=model.universes.getByTimeEntry(te_id);
                    if (universe==null) authorized=true; // delete task, give access
                }
            }
        } else if (chat.startsWith("g")) {
            let task_id = chat.substring(1);
            let task = model.groups.getTaskById(task_id);
            if (task == null) return false;
            let universe = model.groups.getUniverse(task.group_id);
            if (universe.universe_id != universe.universe_id) {
                authorized = false;
            } else {
                if (!authorized && model.students.canUpdateTask(user.user_id, task_id, universe.universe_id)) {
                    authorized = true;
                }
            }
        } else if (chat.startsWith("t")) {
            let time_id = chat.substring(1);
            let time = model.students.getEntryInSameGroup(user.user_id, time_id);
            if (time == null) return false;
            let universe = model.universes.getByTimeEntry(time.timeentry_id);
            if (universe == null) {
                authorized = false;
            } else {
                if (!authorized && model.students.canUpdateSlice(user.user_id, time.slice_id, universe.universe_id)) { // the user is allowed to edit this slice
                    authorized = true;
                }
            }
        }
        return authorized;
    }

    return {
        get(params) {
            if (!isAuthorized(params.chat, params.universe_id)) {
                throw new HTTPError("Access Denied", 403);
            }

            if (params.listen === true) {
                let sid = ws().sid; // unique id for this socket, we allow only one conversation per socket
                if (sid in conversations) {
                    removeListener(conversations[sid].chat, conversations[sid].cb);
                }
                let cb = (msg) => {
                    send(msg);
                };
                conversations[sid] = {
                    chat: params.chat,
                    cb
                }
                addListener(params.chat, cb);
            }
            return model.board.getChat(user.user_id, params.chat);
        },
        forget(params) {
            if (!isAuthorized(params.chat)) {
                throw new HTTPError("Access Denied", 403);
            }
            let sid = ws().sid;

            if (sid in conversations && conversations[sid].chat == params.chat) {
                removeListener(conversations[sid].chat, conversations[sid].cb);
                delete conversations[sid];
            }
        },
        create(params) {
            if (!isAuthorized(params.chat)) {
                throw new HTTPError("Access Denied", 403);
            }

            if ("file" in params) {
                let msg = model.board.add(user.user_id, params.chat, null, params.file);
                broadcast(params.chat, msg);
                return msg;
            } else if ("msg" in params) {
                let msg = model.board.add(user.user_id, params.chat, params.msg);
                broadcast(params.chat, msg);
                return msg;
            }
        },
        count(params) {
            if (!isAuthorized(params.chat)) {
                throw new HTTPError("Access Denied", 403);
            }

            model.board.count(user.user_id, params.chat, params.count);
        }
    }
}