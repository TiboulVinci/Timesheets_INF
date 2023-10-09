(() => {

    let universeSelect = document.querySelector("#groups select");
    let universes = {};

    let table = smartTable({
        root: document.querySelector('#groups table'),
        filter: document.querySelector('#groups input'),
        refresh(focus) {
            let search = {};
            let uid = parseInt(universeSelect.value);
            search.universe_id = isNaN(uid) ? -1 : uid;
            mispaf.ajax({
                url: "groups/list",
                type: 'POST',
                data: search,
                success(response) {
                    table.set(response);
                    if (focus) {
                        let last=0;
                        for(let i=0; i<response.length; i++) {
                            if (response[i].group_id>last) last=response[i].group_id;
                        }
                        let rows=table.get();
                        for(let i=0; i<rows.length; i++) {
                            if (last==response[i].group_id) {
                                table.focus(i);
                                break;
                            }
                        }
                    } 
                }
            })
        },
        columns: [
            {
                title: "Group",
                render(row) {
                    return mispaf.escape(row.name);
                },
                onedit(element, row, val) {
                    row.name = val;
                    mispaf.ajax({
                        url: "groups/set",
                        type: 'POST',
                        data: row
                    });
                }
            }, {
                title: "Universe",
                render(row) {
                    return mispaf.escape(universes[row.universe_id].name);
                }
            }, {
                title: "Users",
                render(row) {
                    let html=['<select multiple multiselect-search="true" multiselect-hide-x="true" multiselect-max-items="10">'];
                    for (let i = 0; i < row.users.length; i++) {
                        let u = row.users[i];
                        html.push(`<option selected="true" value="${u.user_id}">${mispaf.escape(u.login)}</option>`);
                    }
                    html.push("</select>");
                    return html.join('');
                },
                onevent:{
                    'render':(event,row) =>{
                        let select=event.target.children[0];
                        MultiselectDropdown(select, {
                            style:{width:"auto"}, 
                            beforeOpen:(show)=>{
                                let search = {};
                                let uid = parseInt(universeSelect.value);
                                search.universe_id = isNaN(uid) ? -1 : uid;
                                let users = {};
                                for (let i = 0; i < row.users.length; i++) {
                                    users[row.users[i].user_id] = true;
                                }
                                mispaf.ajax({
                                    url: "groups/listUsersNotInGroups",
                                    type: 'POST',
                                    data: search,
                                    success(response) {
                                        select.innerHTML='';
                                        for (let i = 0; i < row.users.length; i++) {
                                            let u = row.users[i];
                                            let option = document.createElement("OPTION");
                                            option.innerHTML = mispaf.escape(u.login);
                                            option.setAttribute("value", u.user_id);
                                            option.setAttribute("selected", 'true');
                                            select.appendChild(option);
                                        }
                                        for (let i = 0; i < response.length; i++) {
                                            let u = response[i];
                                            let option = document.createElement("OPTION");
                                            option.innerHTML = mispaf.escape(u.login);
                                            option.setAttribute("value", u.user_id);
                                            select.appendChild(option);
                                        }
                                        select.loadOptions();
                                        show();
                                    }
                                });        
                            },
                            beforeClose(close) {
                                let data=[];
                                let users=[];
                                for(let i=0; i<select.children.length; i++) {
                                    let opt=select.children[i];
                                    if (opt.selected) {
                                        data.push(parseInt(opt.getAttribute("value")));
                                        users.push({
                                            user_id:parseInt(opt.getAttribute("value")),
                                            login:opt.innerHTML
                                        });
                                    }
                                }
                                for (let i = 0; i < data.length; i++) data[i] = parseInt(data[i]);
                                mispaf.ajax({
                                    url: "groups/setUsers",
                                    mimeType: 'application/json',
                                    data: {
                                        group_id: row.group_id,
                                        users: data
                                    },
                                    success() {
                                        row.users=users;
                                        mispaf.ajaxDefault.success();
                                    },
                                    error(msg) {
                                        mispaf.ajaxDefault.error(msg);
                                        mispaf.page(mispaf.page());
                                    }
                                });
                                close();
                            }
                        });
                    }
                }
            }, {
                title: "Action",
                render() {
                    return `<button class="btn btn-outline-secondary btn-sm delete">Delete</button>`;
                },
                onevent: {
                    async 'click:button.delete'(event, row) {
                        if (await modalConfirm("Do you want to delete " + row.name + " ?")) {
                            mispaf.ajax({
                                url: "groups/delete",
                                data: row,
                                success() {
                                    table.removeRow(row);
                                },
                                async error(msg, status) {
                                    if (msg.startsWith("FOREIGN")) {
                                        if (await modalConfirm("WARNING: This group has entries in the database.!\nDo you want to delete " + row.name + " anyway ?\nWARNING: All related information will be lost forever.")) {
                                            mispaf.ajax({
                                                url: "groups/wipe",
                                                type: 'POST',
                                                data: row,
                                                success() {
                                                    table.removeRow(row);
                                                    mispaf.ajaxDefault.success();
                                                }
                                            });
                                        }
                                    } else {
                                        mispaf.ajaxDefault.error(msg, status);
                                    }
                                }
                            });
                        }
                    }
                }
            }
        ],
        onadd() {
            mispaf.ajax({
                url: "groups/add",
                data: {
                    name: "New Group",
                    universe_id: universeSelect.value
                },
                success(response) {
                    table.refresh(true);
                    mispaf.ajaxDefault.success();
                }
            })
        }
    })


    function refreshUniverse() {
        universeSelect.innerHTML = "";
        mispaf.ajax({
            url: "universes/list",
            type: 'POST',
            success(response) {
                let cur=parseInt(localStorage.getItem("universe_id"));
                universeSelect.innerHTML = "";
                universes = {};
                for (let i = 0; i < response.length; i++) {
                    universes[response[i].universe_id] = response[i];
                    let option = document.createElement("OPTION");
                    let state = [];
                    if (response[i].active == 0) state.push("Inactive");
                    if (response[i].registrable == 0) state.push("Registration closed");
                    if (state.length > 0) {
                        state = " (" + state.join(", ") + ")";
                    } else {
                        state = "";
                    }
                    option.innerHTML = mispaf.escape(response[i].name + state);
                    option.setAttribute("value", response[i].universe_id);
                    if (response[i].universe_id==cur) {
                        option.setAttribute("selected", "true");
                    }
                    universeSelect.appendChild(option);
                }
                table.refresh();
            }
        })
    }

    universeSelect.addEventListener('change', ()=>{
        localStorage.setItem("universe_id", universeSelect.value);
        table.refresh();
    });

    mispaf.addPageListener('enter:groups', refreshUniverse);
})();