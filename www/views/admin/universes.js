

(() => {
    let table = smartTable({
        root: document.querySelector('#universes table'),
        refresh() {
            mispaf.ajax({
                url: "universes/list",
                type: 'POST',
                success(response) {
                    table.set(response);
                }
            })
        },
        columns: [
            {
                title: "Universe",
                render(row) {
                    return mispaf.escape(row.name);
                },
                onedit(element, row, val) {
                    row.name = val;
                    mispaf.ajax({
                        url: "universes/set",
                        data: row
                    });
                }
            }, {
                title: "Creator",
                render(row) {
                    return mispaf.escape(row.creator);
                }
            }, {
                title: "Open",
                tooltip: "When open, users can register to this universe",
                render(row) {
                    return `<input type="checkbox" ${row.registrable == 1 ? "checked" : ""}>`;
                },
                onevent: {
                    'click:input': (event, row) => {
                        row.registrable = event.target.checked ? 1 : 0;
                        mispaf.ajax({
                            url: "universes/set",
                            data: row
                        });
                    }
                }
            }, {
                title: "Active",
                tooltip: "When inactive, users cannot access or see this universe anymore",
                render(row) {
                    return `<input type="checkbox" ${row.active == 1 ? "checked" : ""}>`;
                },
                onevent: {
                    'click:input': (event, row) => {
                        row.active = event.target.checked ? 1 : 0;
                        mispaf.ajax({
                            url: "universes/set",
                            data: row
                        });
                    }
                }
            }, {
                title: "Lockable",
                tooltip: "Tasks added on the day a slice is created have a lock.",
                render(row) {
                    return `<input type="checkbox" ${row.lockable == 1 ? "checked" : ""}>`;
                },
                onevent: {
                    'click:input': (event, row) => {
                        row.lockable = event.target.checked ? 1 : 0;
                        mispaf.ajax({
                            url: "universes/set",
                            type: 'POST',
                            data: row
                        });
                    }
                }
            }, {
                title: "Assistants",
                render(row) {
                    if (row.creator_id == mispaf.user.user_id || mispaf.user.superadmin == 1) {
                        let html = ['<select multiple multiselect-search="true" multiselect-hide-x="true" multiselect-max-items="10">'];
                        if (row.assistants) for (let i = 0; i < row.assistants.length; i++) {
                            let u = row.assistants[i];
                            html.push(`<option selected="true" value="${u.user_id}">${mispaf.escape(u.login)}</option>`);
                        }
                        html.push("</select>");
                        return html.join('');
                    } else {
                        let html = [];
                        if (row.assistants) for (let i = 0; i < row.assistants.length; i++) {
                            let u = row.assistants[i];
                            html.push(`<span class="highlight">${u.login}</span> `);
                        }
                        if (!row.assistants || row.assistants.length == 0) {
                            html.push('&lt;None&gt;')
                        }
                        return html.join('');
                    }
                },
                onevent: {
                    'render': (event, row) => {
                        if (row.creator_id == mispaf.user.user_id || mispaf.user.superadmin == 1) {
                            let select = event.target.children[0];
                            MultiselectDropdown(select, {
                                style: { width: "auto" },
                                beforeOpen: (show) => {
                                    let search = { universe_id: row.universe_id };
                                    mispaf.ajax({
                                        url: "universes/listPossibleAssistants",
                                        type: 'POST',
                                        data: search,
                                        success(response) {
                                            select.innerHTML = '';
                                            for (let i = 0; i < row.assistants.length; i++) {
                                                let u = row.assistants[i];
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
                                    let data = [];
                                    let assistants = [];
                                    for (let i = 0; i < select.children.length; i++) {
                                        let opt = select.children[i];
                                        if (opt.selected) {
                                            data.push(parseInt(opt.getAttribute("value")));
                                            assistants.push({
                                                user_id: parseInt(opt.getAttribute("value")),
                                                login: opt.innerHTML
                                            });
                                        }
                                    }
                                    for (let i = 0; i < data.length; i++) data[i] = parseInt(data[i]);
                                    mispaf.ajax({
                                        url: "universes/setAssistants",
                                        mimeType: 'application/json',
                                        data: {
                                            universe_id: row.universe_id,
                                            assistants: data
                                        },
                                        success() {
                                            row.assistants = assistants;
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
                }
            }, {
                title: "Action",
                render(row) {
                    if (row.creator_id == mispaf.user.user_id || mispaf.user.superadmin === true) {
                        return `<button class="btn btn-outline-secondary btn-sm export">Excel...</button> <button class="btn btn-outline-secondary btn-sm delete">Delete</button>`;
                    } else {
                        // as an assistant, I can remove myself from the universe
                        return `<button class="btn btn-outline-secondary btn-sm export">Excel...</button> <button class="btn btn-outline-secondary btn-sm leave" title="Remove yourself as an assistant from this universe">Leave</button>`;
                    }
                },
                onevent: {
                    'click:button.delete': async (event, row) => {
                        if (await modalConfirm("Do you want to delete " + row.name + " ?")) {
                            mispaf.ajax({
                                url: "universes/delete",
                                type: 'POST',
                                data: row,
                                success() {
                                    table.removeRow(row);
                                },
                                async error(msg, status) {
                                    if (msg.startsWith("FOREIGN")) {
                                        if (await modalConfirm("WARNING: This universe is not empty!\nDo you want to delete " + row.name + " anyway ?\nWARNING: All tasks, slices will be lost forever.")) {
                                            mispaf.ajax({
                                                url: "universes/wipe",
                                                type: 'POST',
                                                data: row,
                                                success() {
                                                    table.removeRow(row);
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
                    'click:button.leave': async (event, row) => {
                        if (await modalConfirm("Do you want to remove yourself as an assistant from " + row.name + " ?")) {
                            mispaf.ajax({
                                url: "universes/leave",
                                type: 'POST',
                                data: row,
                                success() {
                                    table.removeRow(row);
                                }
                            });
                        }
                    },
                    'click:button.export': async (event, row) => {
                        if (await modalConfirm("Do you want to export all timesheets data of " + row.name + " to Excel ?")) {
                            let form = document.createElement('form');
                            form.setAttribute('method', 'POST');
                            form.setAttribute('action', 'universes/export');
                            let input = document.createElement('input');
                            input.setAttribute('type', 'hidden');
                            input.setAttribute('name', 'universe_id');
                            input.value = row.universe_id;
                            form.appendChild(input);
                            document.body.appendChild(form);
                            form.submit();
                            document.body.removeChild(form);
                        }
                    }
                }
            }
        ],
        async onadd() {
            if (await modalConfirm("Do you want to add a universe ?")) {
                mispaf.ajax({
                    url: "universes/create",
                    data: { name: "New Universe", registrable: 1, active: 1 },
                    success(response) {
                        table.appendRow(response);
                        let tr = table.root.querySelector("tbody tr:last-child");
                        let td = tr.children[0];
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
                });
            }
        }
    })


    mispaf.addPageListener('enter:universes', table.refresh);
})();