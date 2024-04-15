(() => {

    let universeSelect = document.querySelector('#spy select[name="universe"]');
    let universes = {};

    let groupSelect = document.querySelector('#spy select[name="group"]');
    let groups = {}

    let sliceSelect = document.querySelector('#spy select[name="slice"]');
    let slices = {}
    let slice = null;
    let tdiv = document.querySelector("#spy .table-responsive");
    let mdiv = document.querySelector("#spy .messages");

    let selected = null;
    let board = messageBoard({
        el: mdiv,
        urlcreate: "board/create",
        urlforget: "board/forget",
        urlget: "board/get",
        urlupload: "upload/board",
        ajax: websocket.ajax,
        broadcastListener: websocket.addBroadcastListener,
        canSend: true,
        extraParams() {
            return {
                universe_id: universeSelect.value
            }
        }
    });
    board.onmessage((chat, count) => {
        let display = tdiv.querySelector(`[data-chat="${chat}"]`);
        if (display != null) {
            if (count == 0) {
                display.innerHTML = display.innerHTML.substring(0, 2).trim();
            } else {
                display.innerHTML = display.innerHTML.substring(0, 2).trim() + " " + count;
            }
        }
    });

    function getUniverse() {
        return parseInt(universeSelect.value);
    }
    function getGroup() {
        return parseInt(groupSelect.value);
    }
    function getSlice() {
        return parseInt(sliceSelect.value);
    }

    let progresses = document.querySelector('#spy .progresses');

    let table = smartTable({
        root: document.querySelector('#spy table'),
        filter: document.querySelector('#spy input[name="filter"]'),
        refresh() {
            progresses.innerHTML = '';
            if (isNaN(getUniverse()) || isNaN(getGroup()) || isNaN(getSlice())) {
                table.set([]);
            } else {
                mispaf.ajax({
                    url: "groups/userTasks",
                    type: 'POST',
                    data: {
                        universe_id: getUniverse(),
                        slice_id: getSlice(),
                        group_id: getGroup()
                    },
                    success(response) {
                        slice = slices[getSlice()];
                        table.set(response);
                        let sel = tdiv.querySelector(".selected");
                        if (sel != null) {
                            board.setBoard(sel.getAttribute("data-chat"));
                        } else {
                            board.setBoard(null);
                        }
                        let users = {};
                        for (let i = 0; i < response.length; i++) {
                            if (!(response[i].login in users)) {
                                users[response[i].login] = [];
                            }
                            users[response[i].login].push(response[i]);
                        }
                        let uid = getUniverse();
                        let gid = getGroup();
                        mispaf.ajax({
                            url: "groups/listUsersInGroup",
                            data: { universe_id: uid, group_id: gid },
                            success(response) {
                                if (uid == getUniverse() && gid == getGroup()) {
                                    let divs = [];
                                    for (let i = 0; i < response.length; i++) {
                                        let head=document.createElement("DIV");
                                        let login = document.createElement("A");
                                        login.setAttribute("onclick", `showUser("${response[i].login}")`);
                                        login.innerText = response[i].login;
                                        login.setAttribute('href', '#')
                                        head.appendChild(login);
                                        progresses.appendChild(head);
                                        let data;
                                        if (response[i].login in users) {
                                            data = users[response[i].login];
                                        } else {
                                            data = [];
                                        }
                                        let locked=false;
                                        for(let j=0; j<data.length; j++) {
                                            if ((new Date(data[j].creation) <= new Date(slice.start_date)) && slice.locked == 1) {
                                                locked=true;
                                                break;
                                            }
                                        }
                                        if (locked) {
                                            head.innerHTML+="&#128274;";
                                        }
                                        let prog = document.createElement("DIV");
                                        prog.classList.add("progress");
                                        progresses.appendChild(prog);
                                        progress({ root: prog }).set(data);
                                        divs.push({ p: prog, v: parseInt(prog.getAttribute("data-actual")) });
                                        head.appendChild(document.createTextNode("   "+prog.getAttribute("data-actual")+"min total"));
                                    }
                                    let max = 0;
                                    for (let i = 0; i < divs.length; i++) max = Math.max(divs[i].v, max);
                                    if (max > 0) {
                                        for (let i = 0; i < divs.length; i++) {
                                            divs[i].p.style.width = (100 * divs[i].v / max) + "%";
                                            divs[i].p.style.minWidth = "100px";
                                        }
                                    }
                                }

                            }
                        })


                    }
                });
            }
        },
        columns: [
            {
                title: "Description",
                render(row) {
                    return renderTask(row, slice);
                },
            },
            {
                title: "Owner",
                render(row) {
                    return mispaf.escape(row.login);
                }
            },
            {
                title: "Start",
                render(row) {
                    return mispaf.escape(new Date(row.creation).toLocaleDateString());
                }
            },
            {
                title: "Progress",
                render(row) {
                    return mispaf.escape(row.progress + " %");
                }
            },
            {
                title: "Length",
                render(row) {
                    return mispaf.escape(row.length + " min.");
                }
            }, {
                title: "Messages",
                render(row) {
                    return `<button class="btn btn-outline-secondary btn-sm messages ${(selected == ("t" + row.timeentry_id)) ? 'selected' : ''}" data-chat="t${row.timeentry_id}" >&#128172;${row.messages > 0 ? " " + row.messages : ""}</button>`;
                },
                onevent: {
                    async 'click:button'(event, row) {
                        if (event.target.classList.contains("selected")) {
                            selected = null;
                            event.target.classList.remove("selected");
                            board.setBoard(null);
                        } else {
                            selected = "t" + row.timeentry_id;
                            let old = tdiv.querySelector('.selected');
                            if (old) old.classList.remove("selected");
                            event.target.classList.add("selected");
                            board.setBoard(selected);
                        }
                    }
                }
            }
        ]
    })

    function clear() {
        table.set([]);
        board.setBoard(null);
    }

    function refreshSlices() {
        clear();
        let uid = getUniverse();
        let gid = getGroup();
        sliceSelect.innerHTML = '';
        if (isNaN(uid)) return;
        if (isNaN(gid)) return;
        mispaf.ajax({
            url: "slices/list",
            data: { universe_id: uid },
            success(response) {
                let cur = parseInt(localStorage.getItem("slice_id"));
                slices = {};
                for (let i = 0; i < response.length; i++) {
                    slices[response[i].slice_id] = response[i];
                    let option = document.createElement("OPTION");
                    option.innerHTML = mispaf.escape(response[i].name);
                    option.setAttribute("value", response[i].slice_id);
                    if (response[i].slice_id == cur) {
                        option.setAttribute("selected", "true");
                    }
                    sliceSelect.appendChild(option);
                }
                table.refresh();
            }
        })
    }

    function refreshGroups() {
        clear();
        let uid = getUniverse();
        groupSelect.innerHTML = '';
        if (isNaN(uid)) return;
        mispaf.ajax({
            url: "groups/list",
            data: { universe_id: uid },
            success(response) {
                let cur = parseInt(localStorage.getItem("group_id"));
                groups = {};
                let option = document.createElement("OPTION");
                option.innerHTML = `(${response.length} group${response.length > 0 ? "s" : ""})`
                groupSelect.appendChild(option);
                for (let i = 0; i < response.length; i++) {
                    groups[response[i].group_id] = response[i];
                    let option = document.createElement("OPTION");
                    option.innerHTML = mispaf.escape(response[i].name);
                    option.setAttribute("value", response[i].group_id);
                    if (response[i].group_id == cur) {
                        option.setAttribute("selected", "true");
                    }
                    groupSelect.appendChild(option);
                }
                setGroup();
            }
        })
    }

    function refreshUniverse() {
        clear();
        universeSelect.innerHTML = "";
        progresses.innerHTML = '';
        mispaf.ajax({
            url: "universes/list",
            success(response) {
                let cur = parseInt(localStorage.getItem("universe_id"));
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
                    if (response[i].universe_id == cur) {
                        option.setAttribute("selected", "true");
                    }
                    universeSelect.appendChild(option);
                }
                refreshGroups();
            }
        })
    }

    universeSelect.addEventListener('change', () => {
        localStorage.setItem("universe_id", universeSelect.value);
        refreshUniverse();
    });

    function setGroup() {
        board.setMyself(boardName(mispaf.user.login));
        refreshSlices();
    }

    groupSelect.addEventListener('change', () => {
        localStorage.setItem("group_id", getGroup());
        setGroup();
    });
    sliceSelect.addEventListener('change', () => {
        localStorage.setItem("slice_id", getSlice());
        table.refresh();
    });

    mispaf.addPageListener('enter:spy', refreshUniverse);

})()
