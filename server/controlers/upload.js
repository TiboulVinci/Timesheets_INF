const path=require("path");
const crypto=require("crypto");

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function uuid() {
    return ([1e7]+"").replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function now() {
    return new Date().toISOString().replace(/[-:ZT]/g,"").replace(/\..*/g,"");
}

module.exports = ({ HTTPError, user, assert, getRequest, config }) => {

    // this controller is separate from the board controller because it doesn't use the websocket

    assert(() => {
        if (user.validated !== true) throw new HTTPError("Access Denied", 403)
    });

    return {
        board() {
            let req=getRequest();
            let file=req.files.file;
            let partial=path.join(config.uploadDirectory,now()+"-"+user.user_id+"-"+uuid()+"_"+file.name);
            let full=path.join("www",partial);
            file.mv(full);
            console.log(full);
            return {file:partial.replace(/\\/g,"/")};
        }
    }
}