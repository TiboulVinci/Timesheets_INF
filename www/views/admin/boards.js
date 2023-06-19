(() => {


    let select = document.querySelector("#boards select");
    let selected = null;

    let universe_id = null;

    let tdiv = document.querySelector("#boards .table-responsive");
    let mdiv = document.querySelector("#boards .messages");

    let board = messageBoard({
        el: mdiv,
        urlcreate: "board/create",
        urlforget: "board/forget",
        urlget: "board/get",
        ajax: websocket.ajax,
        broadcastListener: websocket.addBroadcastListener,
        canSend: false,
        extraParams() {
            return {
                universe_id: universe_id
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


    let table = smartTable({
        root: document.querySelector('#boards table'),
        refresh() {
            if (isNaN(parseInt(select.value))) {
                clear();
            } else {
                mispaf.ajax({
                    url: "users/boards",
                    type: 'POST',
                    data: {
                        user_id: parseInt(select.value)
                    },
                    success(response) {
                        table.set(response);
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
                }
            }, {
                title: "Universe",
                render(row) {
                    return mispaf.escape(row.universe);
                }
            }, {
                title: "Messages",
                render(row) {
                    return `<button class="btn btn-outline-secondary btn-sm messages ${(selected == row.chat) ? 'selected' : ''}" data-chat="${row.chat}" >&#128172;${row.messages > 0 ? " " + row.messages : ""}</button>`;
                },
                onevent: {
                    async 'click:button'(event, row) {
                        if (event.target.classList.contains("selected")) {
                            selected = null;
                            event.target.classList.remove("selected");
                            board.setBoard(null);
                        } else {
                            selected = row.chat;
                            let old = tdiv.querySelector('.selected');
                            if (old) old.classList.remove("selected");
                            event.target.classList.add("selected");
                            universe_id = row.universe_id;
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

    function refreshUsers() {
        clear();
        let current = select.value;
        select.innerHTML = "";
        mispaf.ajax({
            url: "users/list",
            success(response) {
                select.innerHTML = "";
                let option = document.createElement("OPTION");
                select.appendChild(option);
                for (let i = 0; i < response.length; i++) {
                    let option = document.createElement("OPTION");
                    let state = [];
                    if (response[i].admin == 1) state.push("Administrator");
                    if (response[i].superadmin == 1) state.push("SuperAdmin");
                    if (response[i].validated == 0) state.push("Inactive");
                    if (state.length > 0) {
                        state = " (" + state.join(", ") + ")";
                    } else {
                        state = "";
                    }
                    option.innerHTML = mispaf.escape(response[i].login + state);
                    option.setAttribute("value", response[i].user_id);
                    if (response[i].user_id == current) {
                        option.setAttribute("selected", "true");
                    }
                    select.appendChild(option);
                }
                table.refresh();
            }
        })
    }

    select.addEventListener('change', table.refresh);

    mispaf.addPageListener('enter:boards', () => {
        board.setMyself(boardName(mispaf.user.login));
        refreshUsers();
    });

})()
