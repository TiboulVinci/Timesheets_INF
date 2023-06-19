(() => {

    let universeSelect = document.querySelector('#spyTasks select[name="universe"]');
    let universes = {};

    let groupSelect = document.querySelector('#spyTasks select[name="group"]');
    let groups = {}

    let kanbanTypes = null;

    function kanban(data) {
        let root = document.querySelector("#spyTasks .kanban");
        root.innerHTML = "<thead></thead><tbody></tbody>";
        let thead = root.querySelector("tbody");
        let tbody = root.querySelector("tbody");
        let tr = document.createElement("TR");
        thead.appendChild(tr);
        for (let i = 0; i < kanbanTypes.length; i++) {
            let th = document.createElement("TH");
            th.innerText = kanbanTypes[i].description;
            tr.appendChild(th);
        }
        let hidedone=document.getElementById("hidedone").checked;
        for (let i = 0; i < data.length; i++) {
            if (data[i].type_id != null) {
                let tr = document.createElement("TR");
                tbody.appendChild(tr);
                for (let j = 0; j < kanbanTypes.length; j++) {
                    let td = document.createElement("TD");
                    if (kanbanTypes[j].type_id == data[i].type_id) {
                        let span = document.createElement("SPAN");
                        span.innerText = data[i].description;
                        td.appendChild(span);
                    }
                    tr.appendChild(td);
                }
                if (hidedone && data[i].type_id==kanbanTypes[kanbanTypes.length-1].type_id) {
                    tr.style.display="none";
                }
            }
        }
    }

    function renderDate(key) {
        return function (row) {
            let d = row[key];
            if (d == null) {
                return ``;
            } else {
                return new Date(d).toLocaleDateString();
            }
        }
    }

    function refreshGantt() {
        if (document.getElementById("hidedone").checked) {
            let orig=table.get();
            let data=[];
            for(let i=0; i<orig.length; i++) {
                if (orig[i].type_id!=kanbanTypes[kanbanTypes.length-1].type_id) {
                    data.push(orig[i]);
                }
            }
            ganttDiagram.refresh(data);
        } else {
            ganttDiagram.refresh(table.get());
        }
    }

    function getUniverse() {
        return parseInt(universeSelect.value);
    }
    function getGroup() {
        return parseInt(groupSelect.value);
    }

    let selected = null;

    let tdiv = document.querySelector("#spyTasks .table-responsive");
    let mdiv = document.querySelector("#spyTasks .messages");

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

    let ganttDiagram = gantt.create(document.getElementById("gantt"));

    let table = smartTable({
        root: document.querySelector('#spyTasks table'),
        filter: document.querySelector('#spyTasks input[name="filter"]'),
        refresh() {
            if (isNaN(getUniverse()) || isNaN(getGroup())) {
                table.set([]);
            } else {
                mispaf.ajax({
                    url: "groups/groupTasks",
                    type: 'POST',
                    data: {
                        universe_id: getUniverse(),
                        group_id: getGroup()
                    },
                    success(response) {
                        table.set(response);
                        refreshGantt();
                        kanban(table.get());
                        let sel = tdiv.querySelector(".selected");
                        if (sel != null) {
                            board.setBoard(sel.getAttribute("data-chat"));
                        } else {
                            board.setBoard(null);
                        }
                    }
                });
            }
        },
        columns: [
            {
                title: "Description",
                render(row) {
                    return mispaf.escape(row.description);
                },
                onevent: {
                    render(event,row) {
                        if (document.getElementById("hidedone").checked) {
                            if (kanbanTypes[kanbanTypes.length-1].type_id==row.type_id) {
                                event.target.parentElement.style.display='none';
                            }
                        }
                    }
                }
            }, {
                title: "Messages",
                render(row) {
                    return `<button class="btn btn-outline-secondary btn-sm messages ${(selected == ("g" + row.task_id)) ? 'selected' : ''}" data-chat="g${row.task_id}" >&#128172;${row.messages > 0 ? " " + row.messages : ""}</button>`;
                },
                onevent: {
                    async 'click:button'(event, row) {
                        if (event.target.classList.contains("selected")) {
                            selected = null;
                            event.target.classList.remove("selected");
                            board.setBoard(null);
                        } else {
                            selected = "g" + row.task_id;
                            let old = tdiv.querySelector('.selected');
                            if (old) old.classList.remove("selected");
                            event.target.classList.add("selected");
                            board.setBoard(selected);
                        }
                    }
                }
            }, {
                title: "Start",
                render: renderDate("start_date")
            }, {
                title: "End",
                render: renderDate("end_date")
            }, {
                title: "Status",
                render(row) {
                    if (kanbanTypes !== null) {
                        for (let i = 0; i < kanbanTypes.length; i++) {
                            if (kanbanTypes[i].type_id == row.type_id) {
                                return kanbanTypes[i].description;
                            }
                        }
                    }
                    return "";
                }
            }
        ]
    })

    function clear() {
        table.set([]);
        board.setBoard(null);
        ganttDiagram.refresh(table.get());
        kanban(table.get());
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
                if (uid != getUniverse()) return; // received out of order
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

    mispaf.ajax({
        url: "auth/kanbanTypes",
        success(response) {
            kanbanTypes = response;
        }
    });

    universeSelect.addEventListener('change', () => {
        localStorage.setItem("universe_id", universeSelect.value);
        refreshUniverse();
    });

    function setGroup() {
        table.refresh();
        refreshGantt();
        kanban(table.get());
        let memel = document.querySelector('#spyTasks .members');
        memel.innerHTML = '';
        let g = getGroup();
        if (!isNaN(getUniverse()) && !isNaN(g)) {
            listUsersInGroup(memel, getUniverse, getGroup);
        }
    }

    
    document.getElementById('hidedone').addEventListener('change',()=>{
        localStorage.setItem("hidedone",""+document.getElementById('hidedone').checked);
        mispaf.page(mispaf.page());
    });

    groupSelect.addEventListener('change', () => {
        localStorage.setItem("group_id", getGroup());
        setGroup();
    });

    mispaf.addPageListener('enter:spyTasks', () => {
        document.getElementById('hidedone').checked=(localStorage.getItem("hidedone")=="true");
        board.setMyself(boardName(mispaf.user.login));
        refreshUniverse();
    });

})()
