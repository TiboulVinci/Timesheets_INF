const bcrypt = require("bcrypt");

module.exports = ({ HTTPError, model, user, assert }) => {

    assert(() => {
        if (user.admin !== true || user.validated !== true) throw new HTTPError("Access Denied", 403)
    });

    return {
        list(params) {
            if (user.superadmin === false) { // work on own stuff
                return model.users.list(params, user.user_id);
            } else {
                return model.users.list(params);
            }
        },
        listu(params) {
            if (user.superadmin === false) { // work on own stuff
                return model.users.listu(params, user.user_id);
            } else {
                return model.users.listu(params);
            }
        },
        getUserByLogin(params) {
            if (user.superadmin === false) { // work on own stuff
                return model.users.getUserByLogin(params.login, user.user_id);
            } else {
                return model.users.getUserByLogin(params.login);
            }
        },
        validated(params) {
            return model.users.setValidated(params.user_id, params.validated);
        },
        delete(params) {
            if (params.user_id == user.user_id) {
                throw new HTTPError("You cannot delete yourself.");
            }
            return model.users.delete(params.user_id);
        },
        wipe(params) {
            if (params.user_id == user.user_id) {
                throw new HTTPError("You cannot delete yourself.");
            }
            if (user.superadmin == 0) {
                // check if params.user_id is working on an universe that does not belong to user.user_id
                let u = model.users.getAllUniverses(params.user_id);
                for (let i = 0; i < u.length; i++) {
                    if (u[i].creator_id != user.user_id) {
                        throw new HTTPError("This user is using a universe that does not belong to you and cannot be deleted.");
                    }
                }
            }
            return model.users.wipe(params.user_id);
        },
        async changePassword(params) {
            let dbuser = model.users.getById(params.user_id);
            if (dbuser==null) {
                throw new HTTPError("Unknown user.", 404);
            }
            params.password1 = params.password1.trim();
            if (params.password1 == "") {
                throw new HTTPError("Missing password.", 422);
            } else if (params.password1 != params.password2) {
                throw new HTTPError("Passwords are different.", 422);
            } else if (params.password1.length < 8) {
                throw new HTTPError("Password is too short (8+).", 422);
            }
            let hash = await bcrypt.hash(params.password1, 10);
            model.users.updatePassword(params.user_id, hash);
        },
        async changeAdmin(params) {
            if (user.superadmin !== true || user.validated !== true) throw new HTTPError("Access Denied", 403)
            let dbuser = model.users.getById(params.user_id);
            if (dbuser==null) {
                throw new HTTPError("Invalid user for operation.", 404);
            }
            model.users.updateAdmin(params.user_id, params.admin);
        },
        universes(params) {
            if (user.superadmin === false) { // work on own stuff
                return model.users.setUniverses(params.user_id, params.universes, user.user_id);
            } else {
                return model.users.setUniverses(params.user_id, params.universes);
            }
        },
        boards(params) {
            if (user.superadmin === true) { 
                return model.users.boards(params.user_id, true);
            } else {
                // TODO: work on own stuff
                return model.users.boards(params.user_id, true, user.user_id);
            }
        }
    }
}