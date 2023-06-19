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

    function accessControlSlice(sid) {
        if (user.superadmin === false) { // work on own stuff
            let universe = model.slices.getUniverseWithAccessRight(sid, user.user_id);
            if (universe == null) {
                throw new HTTPError("Access Denied", 403)
            } else {
                return universe;
            }
        }

    }

    return {
        list(params) {
            let uid = parseInt(params.universe_id);
            accessControlUniverse(uid);
            return model.slices.list(uid);
        },
        set(params) {
            accessControlSlice(params.slice_id);
            return model.slices.setName(params.slice_id, params.name);
        },
        delete(params) {
            accessControlSlice(params.slice_id);
            return model.slices.delete(params.slice_id);
        },
        reset(params) {
            accessControlSlice(params.slice_id);
            model.slices.reset(params.slice_id);
            return model.slices.getByID(params.slice_id);
        },
        wipe(params) {
            accessControlSlice(params.slice_id);
            return model.slices.wipe(params.slice_id);
        },
        add(params) {
            let uid = parseInt(params.universe_id);
            if (isNaN(uid)) throw new HTTPError("Invalid universe", 422);
            params.name = params.name.trim();
            if (params.name.length == 0) throw new HTTPError("Name too short (1+)", 422);
            if (model.slices.getByName(params.name, uid) != null) throw new HTTPError("Slice already exists", 422);
            accessControlUniverse(uid);
            return model.slices.add(params.name, uid);
        },
        close(params) {
            accessControlSlice(params.slice_id);
            model.slices.setEndDate(params.slice_id);
            return model.slices.getByID(params.slice_id);
        },
        open(params) {
            accessControlSlice(params.slice_id);
            model.slices.clearEndDate(params.slice_id);
            return model.slices.getByID(params.slice_id);
        }
    }
}