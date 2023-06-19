(() => {

    let universeSelect = document.querySelector("#users select");
    let universes = {};

    function renderUniverses(row) {
        let html = ['<select multiple multiselect-search="true" multiselect-hide-x="true" multiselect-max-items="10">'];
        for (let i = 0; i < row.universes.length; i++) {
            let id = row.universes[i];
            html.push(`<option class="${universes[id].active == 1 ? "active" : "inactive"}" selected="true" value="${universes[id].universe_id}">${mispaf.escape(universes[id].name)}</option>`);
        }
        html.push("</select>");
        return html.join('');
    }

    function bindUniverses(event, row) {
        let select = event.target.children[0];
        MultiselectDropdown(select, {
            style: { width: "auto" },
            beforeOpen: (show) => {
                select.innerHTML = "";
                let ids = {};
                for (let i = 0; i < row.universes.length; i++) ids[row.universes[i]] = true;
                for (let k in universes) {
                    if (universes[k].active == 0) {
                        // universe not active anymore
                        if (!(k in ids)) continue; // not in the user's list
                    }
                    let option = document.createElement("OPTION");
                    let state = [];
                    if (universes[k].active == 0) state.push("Inactive");
                    if (universes[k].registrable == 0) state.push("Registration closed");
                    if (state.length > 0) {
                        state = " (" + state.join(", ") + ")";
                    } else {
                        state = "";
                    }
                    option.innerHTML = mispaf.escape(universes[k].name + state);
                    option.setAttribute("value", universes[k].universe_id);
                    if (k in ids) {
                        option.setAttribute("selected", "true");
                    }
                    option.setAttribute("class", universes[k].active == 1 ? "active" : "inactive");
                    select.appendChild(option);
                    select.loadOptions();
                    show();
                }
            },
            beforeClose: (close) => {
                let universes = [];
                for (let i = 0; i < select.children.length; i++) {
                    let opt = select.children[i];
                    if (opt.selected) {
                        universes.push(parseInt(opt.getAttribute("value")));
                    }
                }
                mispaf.ajax({
                    url: "users/universes",
                    mimeType: 'application/json',
                    data: { user_id: row.user_id, universes },
                    success() {
                        row.universes = universes;
                        mispaf.ajaxDefault.success();
                        event.target.innerHTML = renderUniverses(row);
                        bindUniverses(event, row);
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

    let table = smartTable({
        root: document.querySelector('#users table'),
        filter: document.querySelector('#users input'),
        refresh() {
            let search = {};
            let uid = parseInt(universeSelect.value);
            if (!isNaN(uid)) search.universe_id = uid;
            mispaf.ajax({
                url: "users/listu",
                type: 'POST',
                data: search,
                success(response) {
                    table.set(response);
                }
            })
        },
        columns: [
            {
                title: "Login",
                render(row) {
                    return mispaf.escape(row.login);
                }
            }, {
                title: "Admin",
                render(row) {
                    return `<input type="checkbox" ${row.admin == 1 ? "checked" : ""} ${mispaf.user.superadmin ? "" : "disabled"}>`;
                },
                onevent: {
                    'click:input': (event, row) => {
                        let admin = event.target.checked;
                        let modal = smartmodal(mispaf.parentElement(event.target, '.page').querySelector('.modal.changeadmin'));
                        let input = modal.el.querySelector("input");
                        modal.title("Change admin status of " + row.login);
                        modal.button(1, () => {
                            let data = {admin}
                            data.user_id = row.user_id;
                            if ((admin && input.value == "ADMIN") || (!admin && input.value == "NOADMIN")) {
                                mispaf.ajax({
                                    url: "users/changeAdmin",
                                    data,
                                    success() {
                                        mispaf.ajaxDefault.success();
                                        row.admin=admin;
                                        modal.close();
                                    }
                                })
                            } else {
                                mispaf.ajaxDefault.error("Wrong input");
                                event.target.checked = !event.target.checked;
                                modal.close();
                            }
                        });
                        modal.button(-1,()=>{
                            event.target.checked = !event.target.checked;
                        });
                        modal.button(0,()=>{
                            event.target.checked = !event.target.checked;
                        });
                        modal.show();
                        input.setAttribute("placeholder", admin ? 'Type ADMIN here to set admin status' : 'Type NOADMIN here to remove admin status');
                    }
                }
            }, {
                title: "Validated",
                tooltip: "Validation is required to log in",
                render(row) {
                    return `<input ${row.admin == 1 ? "disabled" : ""} type="checkbox" ${row.validated == 1 ? "checked" : ""}>`;
                },
                onevent: {
                    'click:input': (event, row) => {
                        row.validated = event.target.checked ? 1 : 0;
                        mispaf.ajax({
                            url: "users/validated",
                            data: row
                        });
                    }
                }
            }, {
                title: "Universes",
                render: renderUniverses,
                onevent: {
                    'render': bindUniverses
                }
            }, {
                title: "Action",
                render() {
                    return `<button class="btn btn-outline-secondary btn-sm delete">Delete</button>
                    <button class="btn btn-outline-secondary btn-sm password">Password</button>`;
                },
                onevent: {
                    async 'click:button.delete'(event, row) {
                        if (await modalConfirm("Do you want to delete " + row.login + " ?")) {
                            mispaf.ajax({
                                url: "users/delete",
                                data: row,
                                success() {
                                    table.removeRow(row);
                                },
                                async error(msg, status) {
                                    if (msg.startsWith("FOREIGN")) {
                                        if (await modalConfirm("WARNING: This user has entries in the database.!\nDo you want to delete " + row.login + " anyway ?\nWARNING: All his tasks will be lost forever.")) {
                                            mispaf.ajax({
                                                url: "users/wipe",
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
                    },
                    'click:button.password'(event, row) {
                        let modal = smartmodal(mispaf.parentElement(event.target, '.page').querySelector('.modal.password'));
                        modal.title("Change password of " + row.login);
                        modal.button(1, () => {
                            let data = mispaf.serializeObject(modal.el.querySelector('form'));
                            data.user_id = row.user_id;
                            mispaf.ajax({
                                url: "users/changePassword",
                                data,
                                success() {
                                    mispaf.ajaxDefault.success();
                                    modal.close();
                                }
                            })
                        })
                        modal.show();
                    }
                }
            }
        ],
        onadd() {
            let modal = smartmodal(mispaf.parentElement(event.target, '.page').querySelector('.modal.adduser'));
            modal.title("Create new user");
            modal.button(1, () => {
                let data = mispaf.serializeObject(modal.el.querySelector('form'));
                mispaf.ajax({
                    url: "auth/register",
                    data,
                    success() {
                        modal.close();
                        table.refresh();
                        mispaf.ajaxDefault.success();
                    }
                })
            })
            modal.show();
        },
        buttons:{
            "Batch operations...":(event)=>{
                mispaf.page('batch');
            }
        }
    })


    function refreshUniverse() {
        mispaf.ajax({
            url: "universes/list",
            type: 'POST',
            success(response) {
                let cur=parseInt(localStorage.getItem("universe_id"));
                universes = {};
                universeSelect.innerHTML = '<option value="">Display all users</option><option value="-1">Display users in no universe</option>';
                if (cur==-1) {
                    universeSelect.children[1].setAttribute("selected", "true");
                }
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

    universeSelect.addEventListener('change', () => {
        localStorage.setItem("universe_id", universeSelect.value);
        table.refresh();
    });

    mispaf.addPageListener('enter:users', refreshUniverse);
})();