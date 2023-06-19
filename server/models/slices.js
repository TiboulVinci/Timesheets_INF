module.exports = ({ db }) => {

    return {
        list(uid) {
            return db.prepare(`
SELECT slices.*, start_date<date() AND universes.lockable=1 AS locked, universes.lockable 
FROM slices INNER JOIN universes ON slices.universe_id=universes.universe_id
WHERE universes.universe_id=?
ORDER BY start_date DESC, slice_id DESC
            `).all(uid);
        },
        setName(sid,name) {
            return db.prepare("UPDATE slices SET name=? WHERE slice_id=?").run(name,sid);
        },
        delete(id) {
            return db.prepare("DELETE FROM slices WHERE slice_id=?").run(id);
        },
        wipe(id) {
            db.prepare("DELETE FROM timeentries WHERE slice_id=?").run(id);
            return db.prepare("DELETE FROM slices WHERE slice_id=?").run(id);
        },
        reset(id) {
            return db.prepare("UPDATE slices SET start_date=date() where slice_id=?").run(id);
        },
        add(name,uid) {
            return db.prepare("INSERT INTO slices(name,universe_id, start_date) VALUES (?,?, date())").run(name,uid);
        },
        getByName(name,uid) {
            return db.prepare("SELECT * FROM slices WHERE name=? AND universe_id=?").get(name,uid);
        },
        setEndDate(sid) {
            return db.prepare("UPDATE slices SET end_date=date() where slice_id=?").run(sid);
        },
        clearEndDate(sid) {
            return db.prepare("UPDATE slices SET end_date=0 where slice_id=?").run(sid);
        },
        getByID(sid) {
            return db.prepare(`SELECT slices.*, start_date<date() AS locked FROM slices WHERE slice_id=?`).get(sid);
        },
        getUniverse(gid) {
            return db.prepare("SELECT * FROM universes INNER JOIN slices ON universes.universe_id=slices.universe_id AND slices.slice_id=?").get(gid);
        },
        getUniverseWithAccessRight(gid, caid) {
            return db.prepare("SELECT * FROM universes INNER JOIN slices ON universes.universe_id=slices.universe_id AND slices.slice_id=? AND (universes.creator_id=? OR EXISTS (SELECT 1 FROM assistants WHERE assistants.universe_id=universes.universe_id AND assistants.user_id=?))").get(gid,caid, caid);
        }
    }
}