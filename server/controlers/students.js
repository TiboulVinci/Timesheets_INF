const bcrypt = require("bcrypt");

module.exports = ({ HTTPError, model, user, assert }) => {

    assert(() => {
        if (user.validated !== true) throw new HTTPError("Access Denied", 403)
    });

    return {
        universes() {
            return model.students.universes(user.user_id);
        },
        slices(params) {
            return model.students.slices(params.universe_id);
        },
        mytasks(params) {
            return model.students.mytasks(user.user_id, user.login, params.slice_id, params.universe_id);
        },
        grouptasks(params) {
            return model.students.grouptasks(user.user_id, user.login, params.universe_id);
        },
        addEntry(params) {
            if (model.students.canUpdateSlice(user.user_id, params.slice_id, params.universe_id)) {
                return model.students.addEntry(user.user_id, params.slice_id, params.description);
            } else {
                throw new HTTPError("Cannot create new task", 403);
            }
        },
        setEntry(params) {
            if (model.students.canUpdateSlice(user.user_id, params.slice_id, params.universe_id)) {
                let slice = model.slices.getByID(params.slice_id);
                if (slice.locked == 1) {
                    let entry=model.students.getEntry(user.userid, params.timeentry_id);
                    if (entry!=null && entry.creation<=slice.start_date) {
                        return model.students.setEntry(user.user_id, params.slice_id, params.timeentry_id, params.progress, params.length);
                    }
                } 
                return model.students.setEntry(user.user_id, params.slice_id, params.timeentry_id, params.progress, params.length, params.description);
            } else {
                throw new HTTPError("Cannot update task", 403);
            }
        },
        deleteEntry(params) {
            let entry = model.students.getEntry(user.user_id, params.timeentry_id);
            if (entry != null // got an entry
                && params.slice_id == entry.slice_id // that's the right slice for this entry
                && model.students.canUpdateSlice(user.user_id, entry.slice_id, params.universe_id)) { // the user is allowed to edit this slice
                let slice = model.slices.getByID(params.slice_id);
                if (slice.locked == 0 || slice.start_date != entry.creation) {
                    return model.students.deleteEntry(user.user_id, slice.slice_id, entry.timeentry_id);
                }
            }
            throw new HTTPError("Cannot delete task", 403);
        },
        setGroupTask(params) {
            if (model.students.canUpdateTask(user.user_id, params.task_id, params.universe_id)) {
                if ("description" in params) return model.students.setTaskDescription(params.task_id, params.description);
                if ("start_date" in params) return model.students.setTaskStart(params.task_id, params.start_date);
                if ("end_date" in params) return model.students.setTaskEnd(params.task_id, params.end_date);
                if ("type_id" in params) return model.students.setTaskKanban(params.task_id, params.type_id);
            }
            throw new HTTPError("Cannot change task", 403);
        },
        deleteGroupTask(params) {
            if (model.students.canUpdateTask(user.user_id, params.task_id, params.universe_id)) {
                return model.students.deleteTask(params.task_id);
            }
            throw new HTTPError("Cannot delete task", 403);
        },
        addGroupTask(params) {
            let group = model.students.getGroup(user.user_id, params.universe_id);
            if (group != null) {
                return model.students.createTask(group.group_id, params.description);
            }
            throw new HTTPError("Cannot create task", 403);
        },
        addEntryToLastOpenSlice(params) {
            let slices = model.students.slices(params.universe_id);
            let cand = null;
            for (let i = 0; i < slices.length; i++) {
                if (slices[i].end_date == 0) {
                    if (cand == null || cand.start_date < slices[i].start_date || (cand.start_date == slices[i].start_date && cand.slice_id < slices[i].slice_id)) cand = slices[i];
                }
            }
            if (cand == null) {
                throw new HTTPError("Nowhere to create task", 403);
            }
            if (model.students.canUpdateSlice(user.user_id, cand.slice_id, params.universe_id)) {
                return model.students.addEntry(user.user_id, cand.slice_id, params.description);
            } else {
                throw new HTTPError("Cannot create new task", 403);
            }
        },
        othersTasks(params) {
            let group = model.students.getGroup(user.user_id, params.universe_id);
            return model.students.othersTasks(user.user_id, group.group_id, params.slice_id)
        }
    }
}