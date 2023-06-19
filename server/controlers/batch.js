const bcrypt = require("bcrypt");

module.exports = ({ HTTPError, model, user, assert, config }) => {

    assert(() => {
        if (user.admin !== true || user.validated !== true) throw new HTTPError("Access Denied", 403)
    });

    return {
        emailsFilter() {
            return config.emails;
        }
    }
}