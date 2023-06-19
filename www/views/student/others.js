(() => {

    let slicesSelect = document.querySelector("#others .sliceselect select");
    let slices = {};
    let slice=null;
    let tdiv=document.querySelector("#others .table-responsive");
    let mdiv = document.querySelector("#others .messages");

    let selected = null;
    let board=messageBoard({
        el:mdiv, 
        urlcreate:"board/create",
        urlforget:"board/forget",
        urlget:"board/get",
        urlcount: "board/count",
        urlupload: "upload/board",
        ajax:websocket.ajax,
        broadcastListener:websocket.addBroadcastListener,
        canSend:true
    });
    board.onmessage((chat,count)=>{
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
        return parseInt(document.getElementById("universe").value);
    }

    function getSlice() {
        return parseInt(slicesSelect.value);
    }

    let progresses=document.querySelector('#others .progresses');

    let table = smartTable({
        root: document.querySelector('#others table'),
        refresh() {
            progresses.innerHTML='';
            if (isNaN(getUniverse()) || isNaN(getSlice())) {
                table.set([]);
                tdiv.classList.add("none");
            } else {
                tdiv.classList.remove("none");
                mispaf.ajax({
                    url: "students/othersTasks",
                    type: 'POST',
                    data: {
                        universe_id:getUniverse(),
                        slice_id:slice.slice_id
                    },
                    success(response) {
                        table.set(response);
                        let sel = tdiv.querySelector(".selected");
                        if (sel != null) {
                            board.setBoard(sel.getAttribute("data-chat"));
                        } else {
                            board.setBoard(null);
                        }
                        let users={};
                        for(let i=0; i<response.length; i++) {
                            if (!(response[i].login in users)) {
                                users[response[i].login]=[];
                            }
                            users[response[i].login].push(response[i]);
                        }
                        let divs = [];
                        for(let u in users) {
                            let prog=document.createElement("DIV");
                            prog.classList.add("progress");
                            let login=document.createElement("DIV");
                            progresses.appendChild(login);
                            progresses.appendChild(prog);
                            progress({root:prog}).set(users[u]);
                            login.innerText=u+"   "+prog.getAttribute("data-actual")+"min total";
                            divs.push({ p: prog, v: parseInt(prog.getAttribute("data-actual")) });
                        }
                        mispaf.ajax({
                            url: "students/mytasks",
                            type: 'POST',
                            data: {
                                universe_id: getUniverse(),
                                slice_id: slice.slice_id
                            },
                            success(response) {
                                let prog=document.createElement("DIV");
                                prog.classList.add("progress");
                                let login=document.createElement("DIV");
                                progresses.appendChild(login);
                                progresses.appendChild(prog);
                                progress({root:prog}).set(response);
                                login.innerHTML="<b>My tasks</b>   "+prog.getAttribute("data-actual")+"min total";
                                divs.push({ p: prog, v: parseInt(prog.getAttribute("data-actual")) });
                                let max = 0;
                                for (let i = 0; i < divs.length; i++) max = Math.max(divs[i].v, max);
                                if (max > 0) {
                                    for (let i = 0; i < divs.length; i++) {
                                        divs[i].p.style.width = (100 * divs[i].v / max) + "%";
                                        divs[i].p.style.minWidth = "100px";
                                    }
                                }
        
                            }});
                    }
                });    
            }
        },
        columns: [
            {
                title: "Description",
                render(row) {
                    return renderTask(row,slice);
                }
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
                    return mispaf.escape(row.progress+" %");
                }
            },
            {
                title: "Length",
                render(row) {
                    return mispaf.escape(row.length+" min.");
                }
            },
            {
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

    function refreshSlices() {
        let current = parseInt(slicesSelect.value);
        slicesSelect.innerHTML="";
        mispaf.ajax({
            url: "students/slices",
            type: 'POST',
            data:{universe_id:getUniverse()},
            success(response) {
                slicesSelect.innerHTML="";
                slices = {};
                for (let i = 0; i < response.length; i++) {
                    slices[response[i].slice_id]=response[i];
                    let option = document.createElement("OPTION");
                    let state=[];
                    if (response[i].end_date!=0) state.push("Closed");
                    if (response[i].locked==1) state.push("Locked");
                    if (state.length>0) {
                        state=" ("+state.join(", ")+")";
                    } else {
                        state="";
                    }
                    option.innerHTML = mispaf.escape(response[i].name+state);
                    option.setAttribute("value", response[i].slice_id);
                    if (response[i].slice_id == current) {
                        option.setAttribute("selected", "true");
                    }
                    slicesSelect.appendChild(option);
                }
                slice=slices[getSlice()];
                table.refresh();
            }
        })
    }

    slicesSelect.addEventListener('change', ()=>{
        slice=slices[getSlice()];
        table.refresh();
    });

    mispaf.addPageListener('enter:others', ()=>{
        board.setMyself(boardName(mispaf.user.login));
        refreshSlices();
    });
    document.getElementById('universe').addEventListener('change',()=>{
        if (mispaf.page()=="others") refreshSlices();
    });
})();