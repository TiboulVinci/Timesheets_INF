const xl = require('excel4node');

module.exports = ({ HTTPError, model, user, assert, getResponse }) => {

    function isNumber(value) {
        return typeof value === 'number' && 
        isFinite(value);
     }

    assert(() => {
        if (user.admin !== true || user.validated !== true) throw new HTTPError("Access Denied", 403)
    });

    function accessControl(uid) {
        if (user.superadmin === false) { // work on own stuff
            let universe = model.universes.getByIDWithAccessRight(uid, user.user_id);
            if (universe == null) {
                throw new HTTPError("Access Denied", 403)
            } else {
                return universe;
            }
        }
    }

    return {
        list() {
            if (user.superadmin === true) {
                return model.universes.list();
            } else {
                return model.universes.list(user.user_id);
            }
        },
        set(params) {
            accessControl(params.universe_id);
            model.universes.set(params);
        },
        delete(params) {
            if (user.superadmin === false) { // work on own stuff
                let universe = model.universes.getByID(params.universe_id);
                if (universe.creator_id != user.user_id) {
                    throw new HTTPError("Access Denied", 403)
                }
            }
            model.universes.delete(params.universe_id);
        },
        wipe(params) {
            accessControl(params.universe_id);
            model.universes.wipe(params.universe_id);
        },
        create(params) {
            params.user_id = user.user_id;
            return model.universes.create(params);
        },
        leave(params) {
            accessControl(params.universe_id);
            if (user.superadmin === false) { // work on own stuff
                let universe = model.universes.getByID(params.universe_id);
                if (universe.creator_id == user.user_id) {
                    throw new HTTPError("You are the creator of this universe, and cannot leave it", 403);
                }
            }
            return model.universes.removeAssistant(params.universe_id, user.user_id);
        },
        listPossibleAssistants(params) {
            if (user.superadmin === false) { // work on own stuff
                let universe = model.universes.getByID(params.universe_id);
                if (universe.creator_id != user.user_id) {
                    throw new HTTPError("Access Denied", 403);
                }
            }
            return model.universes.listPossibleAssistants(params.universe_id);
        },
        setAssistants(params) {
            if (user.superadmin === false) { // restricted to creator
                let universe = model.universes.getByID(params.universe_id);
                if (universe.creator_id != user.user_id) {
                    throw new HTTPError("Access Denied", 403)
                }
            }
            model.universes.setAssistants(params.universe_id, params.assistants);
        },
        async export(params) {
            accessControl(params.universe_id);
            let universe = model.universes.getByID(params.universe_id);
            let data = model.universes.getExportData(universe.universe_id);
            let wb = new xl.Workbook();
            let ws = wb.addWorksheet("Individual Tasks");
            if (data.length > 0) {
                let i = 1;
                for (let k in data[0]) {
                    ws.cell(1, i).string(k);
                    i++;
                }
                for (let i = 0; i < data.length; i++) {
                    let j = 1;
                    for (let k in data[0]) {
                        if (isNumber(data[i][k])) {
                            ws.cell(i + 2, j).number(data[i][k]);
                        } else {
                            ws.cell(i + 2, j).string(data[i][k]);
                        }
                        j++;
                    }
                }
            }
            ws = wb.addWorksheet("Group Tasks");
            ws.cell(1,1).string("description");
            ws.cell(1,2).string("start");
            ws.cell(1,3).string("end");
            ws.cell(1,4).string("status");
            data = model.groups.getTasksByUniverseId(universe.universe_id);
            for(let i=0; i<data.length; i++) {
                ws.cell(i+2,1).string(data[i].description);
                ws.cell(i+2,2).string(data[i].start_date);
                ws.cell(i+2,3).string(data[i].end_date);
                ws.cell(i+2,4).string(data[i].status);
            }

            let buffer = await wb.writeToBuffer();
            let resp = getResponse();
            resp.attachment(universe.name + ".xlsx");
            resp.send(buffer);
            resp.end();
        }
    }
}