const bcrypt = require("bcrypt");

module.exports = ({ HTTPError, model, user, assert }) => {

    assert(() => {
        if (user.admin !== true || user.validated !== true) throw new HTTPError("Access Denied", 403)
    });

    function accessControlUniverse(uid) {
        if (isNaN(uid)) throw new HTTPError("Invalid universe", 422);
        if (user.superadmin === false) { // work on own stuff
            let universe = model.universes.getByIDWithAccessRight(uid, user.user_id);
            if (universe == null) {
                throw new HTTPError("Access Denied", 403)
            } else {
                return universe;
            }
        }
    }

    function accessControlGroup(gid) {
        if (user.superadmin === false) { // work on own stuff
            let universe = model.groups.getUniverseWithAccessRight(gid, user.user_id);
            if (universe == null) {
                throw new HTTPError("Access Denied", 403)
            } else {
                return universe;
            }
        }
    }

    return {
        list(params) {
            accessControlUniverse(params.universe_id);
            return model.groups.list(params.universe_id);
        },
        set(params) {
            accessControlGroup(params.group_id, user.user_id);
            return model.groups.setName(params.group_id, params.name);
        },
        delete(params) {
            accessControlGroup(params.group_id, user.user_id);
            return model.groups.delete(params.group_id);
        },
        wipe(params) {
            accessControlGroup(params.group_id, user.user_id);
            return model.groups.wipe(params.group_id);
        },
        add(params) {
            let uid = parseInt(params.universe_id);
            if (isNaN(uid)) throw new HTTPError("Invalid universe", 422);
            accessControlUniverse(uid);
            params.name = params.name.trim();
            if (params.name.length == 0) throw new HTTPError("Name too short (1+)", 422);
            let suffix = "";
            let c = 0;
            while (model.groups.getByName(params.name + suffix, uid) != null) {
                c++;
                suffix = " " + c + "";
            }
            return model.groups.add(params.name + suffix, uid);
        },
        setUsers(params) {
            accessControlGroup(params.group_id, user.user_id);
            return model.groups.setUsers(params.group_id, params.users);
        },
        listUsersNotInGroups(params) {
            accessControlUniverse(params.universe_id);
            return model.users.listUsersNotInGroups(params.universe_id);
        },
        listUsersInGroup(params) {
            accessControlUniverse(params.universe_id);
            return model.groups.listUsersInGroup(params.group_id);
        },
        userTasks(params) {
            accessControlGroup(params.group_id, user.user_id);
            return model.students.othersTasks(-1, params.group_id, params.slice_id)
        },
        groupTasks(params) {
            accessControlGroup(params.group_id, user.user_id);
            return model.students.grouptasksByID(params.group_id)
        }
    }
}