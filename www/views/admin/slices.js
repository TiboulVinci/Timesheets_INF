(() => {

    let universeSelect = document.querySelector("#slices select");
    let universes = {};

    let table = smartTable({
        root: document.querySelector('#slices table'),
        filter: document.querySelector('#slices input'),
        refresh(focus, text) {
            let search = {};
            let uid = parseInt(universeSelect.value);
            search.universe_id = isNaN(uid) ? -1 : uid;
            mispaf.ajax({
                url: "slices/list",
                type: 'POST',
                data: search,
                success(response) {
                    table.set(response);
                    if (focus) {
                        response.sort((a, b) => a.timeentry_id > b.timeentry_id);
                        let rows = table.get();
                        for (let i = 0; i < rows.length; i++) {
                            if (rows[i].timeentry_id == response[0].timeentry_id) {
                                let tr = table.root.querySelector("tbody").children[i];
                                let td = tr.children[0];
                                if (td.innerText == text) {
                                    td.focus();
                                    let sel, range;
                                    if (window.getSelection && document.createRange) {
                                        range = document.createRange();
                                        range.selectNodeContents(td);
                                        sel = window.getSelection();
                                        sel.removeAllRanges();
                                        sel.addRange(range);
                                    } else if (document.body.createTextRange) {
                                        range = document.body.createTextRange();
                                        range.moveToElementText(td);
                                        range.select();
                                    }
                                }
                            }
                        }
                    }
                }
            })
        },
        columns: [
            {
                title: "Slice",
                render(row) {
                    return mispaf.escape(row.name);
                },
                onedit(element, row, val) {
                    row.name = val;
                    mispaf.ajax({
                        url: "slices/set",
                        data: row
                    });
                }
            },
            {
                title: "Start",
                render(row) {
                    return new Date(row.start_date).toLocaleDateString()+(row.locked==1?"&nbsp;&#128274;":"");
                }
            },
            {
                title: "End",
                render(row) {
                    if (row.end_date != 0) { // I would have prefered to use NULL, but ran into problem with SQLite
                        return new Date(row.end_date).toLocaleDateString();
                    } else {
                        return "";
                    }
                }
            },
            {
                title: "Action",
                render(row) {
                    let html = [];
                    if (row.end_date != 0) {
                        html.push(`<button class="btn btn-outline-secondary btn-sm open">Reopen</button>`)
                    } else {
                        html.push(`<button class="btn btn-outline-secondary btn-sm close">Close</button>`)
                    }
                    html.push(`<button class="btn btn-outline-secondary btn-sm delete">Delete</button>`);
                    if (row.lockable==1 && row.locked==1) {
                        html.push(`<button class="btn btn-outline-secondary btn-sm reset">Reset Lock</button>`);
                    }
                    return html.join(' ');
                },
                onevent: {
                    async 'click:button.delete'(event, row) {
                        if (await modalConfirm("Do you want to delete " + row.name + " ?")) {
                            mispaf.ajax({
                                url: "slices/delete",
                                type: 'POST',
                                data: row,
                                success() {
                                    table.removeRow(row);
                                    mispaf.ajaxDefault.success();
                                },
                                async error(msg, status) {
                                    if (msg.startsWith("FOREIGN")) {
                                        if (await modalConfirm("WARNING: This slice has entries in the database.!\nDo you want to delete " + row.name + " anyway ?\nWARNING: All related information will be lost forever.")) {
                                            mispaf.ajax({
                                                url: "slices/wipe",
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
                    async 'click:button.close'(event, row) {
                        if (await modalConfirm("Do you want to close " + row.name + " ?")) {
                            mispaf.ajax({
                                url: "slices/close",
                                data: row,
                                success(response) {
                                    for (let k in response) row[k] = response[k];
                                    table.renderRow(row);
                                    mispaf.ajaxDefault.success();
                                }
                            });
                        }
                    },
                    async 'click:button.open'(event, row) {
                        if (await modalConfirm("Do you want to open " + row.name + " again ?")) {
                            mispaf.ajax({
                                url: "slices/open",
                                data: row,
                                success(response) {
                                    for (let k in response) row[k] = response[k];
                                    table.renderRow(row);
                                    mispaf.ajaxDefault.success();
                                }
                            });
                        }
                    },
                    async 'click:button.reset'(event, row) {
                        if (await modalConfirm("Do you want to reset the start date of " + row.name + "? Locks will be reset to today.")) {
                            mispaf.ajax({
                                url: "slices/reset",
                                type: 'POST',
                                data: row,
                                success(response) {
                                    for (let k in response) row[k] = response[k];
                                    table.renderRow(row);
                                    mispaf.ajaxDefault.success();
                                }
                            });
                        }
                    }
                }
            }
        ],
        onadd() {
            mispaf.ajax({
                url: "slices/add",
                data: {
                    name: "New Slice",
                    universe_id: universeSelect.value
                },
                success() {
                    table.refresh(true, "New Slice");
                    mispaf.ajaxDefault.success();
                }
            });
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

    universeSelect.addEventListener('change', () => {
        localStorage.setItem("universe_id", universeSelect.value);
        table.refresh();
    });

    mispaf.addPageListener('enter:slices', refreshUniverse);
})();