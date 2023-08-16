const ISFIREFOX = navigator.userAgent.search("Firefox");

function smartTable({ root, refresh, columns, onadd, filter, buttons, excel = true }) {
    let data;

    root.innerHTML = ""; // just start from empty
    if (!root.classList.contains("smart")) {
        root.classList.add("smart");
    }

    let theader = document.createElement("THEAD");
    let tr = document.createElement("TR");
    theader.appendChild(tr);

    for (let i = 0; i < columns.length; i++) {
        if (!("title" in columns[i])) throw new Error("Missing title for column of index " + i);
        let th = document.createElement("TH");
        th.innerHTML = columns[i].title;
        if ("width" in columns[i]) {
            th.style.width = columns[i].width;
        }
        if ("tooltip" in columns[i]) {
            th.setAttribute("title", columns[i].tooltip);
        }
        tr.appendChild(th);
    }

    root.appendChild(theader);

    let tbody = document.createElement("TBODY");
    root.appendChild(tbody);

    if (onadd || buttons) {
        let tfooter = document.createElement("TFOOT");
        root.appendChild(tfooter);
        let tr = document.createElement("TR");
        tfooter.appendChild(tr);
        let html = [];
        if (buttons) {
            html.push(`<td colspan="${columns.length - 1}">`);
            for (let b in buttons) {
                html.push(`<button class="btn btn-outline-secondary">${b}</button>`);
            }
            if (excel && (typeof XLSX != "undefined")) {
                html.push(`<button title="Export to Excel" class="icon spreadsheet">X</button>`)
            }
            html.push('</td><td>');
        } else {
            if (excel && (typeof XLSX != "undefined")) {
                html.push(`<td colspan="${columns.length - 1}">`);
                html.push(`<button title="Export to Excel" class="icon spreadsheet">X</button>`)
                html.push(`</td><td>`);
            } else {
                html.push(`<td colspan="${columns.length}">`);
            }
        }
        html.push(`<button class="btn btn-outline-secondary">+</button></td>`);
        tr.innerHTML = html.join('');
        if (onadd) {
            tr.querySelector('td:last-child button').addEventListener("click", onadd);
        }
        if (buttons) {
            tr.querySelector('td:first-child button.btn').addEventListener("click", (event) => {
                event.preventDefault();
                buttons[event.target.innerHTML](event);
            });
        }
        if (excel && (typeof XLSX != "undefined")) {
            tr.querySelector('td:first-child button.icon').addEventListener("click", (event) => {
                // create a table easier to process.
                let table=document.createElement("TABLE");
                let thead=root.querySelector("thead");
                if (thead) {
                    table.appendChild(thead.cloneNode(true));
                }
                let tbody=root.querySelector("tbody");
                if (tbody) {
                    let html=[];
                    for(let i=0; i<tbody.children.length; i++) {
                        let tr=tbody.children[i];
                        html.push('<tr>');
                        for(let j=0; j<tr.children.length; j++) {
                            let td=tr.children[j];
                            html.push('<td>');
                            td: for(let k=0; k<td.childNodes.length; k++) {
                                let el=td.childNodes[k];
                                if (el instanceof Text) {
                                    html.push(el.data);
                                } else if (el instanceof HTMLElement) {
                                    switch (el.tagName) {
                                        case "INPUT":
                                            switch (el.getAttribute('type')) {
                                                case 'checkbox':
                                                case 'radio':
                                                    html.push(el.checked);
                                                    break;
                                                case 'button':
                                                    break;
                                                default:
                                                    html.push(el.value);
                                            }
                                            break;
                                        case "SELECT":
                                            html.push([...el.querySelectorAll('option:checked')].map((o)=>o.innerText).join(' / '));
                                            break td;
                                        case "BUTTON":
                                            break;
                                        default:
                                            html.push(el.innerText);
                                    }
                                }
                            }
                            html.push('</td>');
                        }
                        html.push('</tr>');
                    }
                    let tgt=document.createElement("tbody");
                    tgt.innerHTML=html.join('');
                    table.appendChild(tgt);
                }
                // do not add tfoot
                let wb = XLSX.utils.table_to_book(table, { sheet: "export" });
                XLSX.writeFile(wb, 'export.xlsx');
            });
        }
    }

    let checkInterval = null;

    function runFilter() {
        if (filter === undefined) return;
        if (checkInterval !== null) {
            clearTimeout(checkInterval);
        }
        checkInterval = setTimeout(() => {
            checkInterval = null;
            for (let i = 0; i < tbody.children.length; i++) {
                let v = filter.value.toLowerCase();
                checkRowFilter(tbody.children[i], v);
            }
        }, 200);
    }

    if (filter) {
        filter.addEventListener('keyup', runFilter);
    }

    function checkRowFilter(row, v = null) {
        if (v == null) v = filter.value.toLowerCase();
        row.classList.remove('filtered');
        if (v == "") {
            return;
        }
        if (row.innerText.toLowerCase().indexOf(v) == -1) {
            row.classList.add('filtered');
        }
    }

    function renderRow(row) {
        let tr = document.createElement("TR");
        for (let j = 0; j < columns.length; j++) {
            let col = columns[j];
            let td = document.createElement('TD');
            tr.appendChild(td);
            if ("render" in col) {
                td.innerHTML = col.render(row);
            }
            if ("onedit" in col) {
                let input = document.createElement("INPUT");
                input.value = td.innerText;
                td.innerText = "";
                td.setAttribute("class", "editable");
                td.appendChild(input);
                td.setAttribute("data-value", td.innerText); //memoize content of td
                input.addEventListener('input', (event) => {
                    if (td.innerHTML.indexOf("<br>") != -1 && !ISFIREFOX) {
                        // on mobile chrome brower, Enter Keypress does not work
                        // but we can detect the presence of <br> in the cell.
                        // However, Firefox behaves strangely with end of line space
                        // and they add a <br> in that case other the space disappears
                        // this <br> then stays at the end you typing more keys
                        event.preventDefault();
                        event.stopPropagation();
                        event.target.blur();
                    }
                });
                input.addEventListener('keydown', (event) => {
                    if (event.key == "Escape") {
                        input.value = td.getAttribute("data-value");
                        event.target.blur();
                    }
                });
                input.addEventListener('keypress', (event) => {
                    if (event.key == "Enter" || event.keyCode == 13) {
                        event.preventDefault();
                        event.stopPropagation();
                        event.target.blur();
                    }
                });
                input.addEventListener('focusout', (event) => {
                    let val = input.value;
                    if (val != td.getAttribute("data-value")) {
                        td.setAttribute("data-value", val);
                        let idx = [...td.parentElement.parentElement.children].indexOf(td.parentElement);
                        if (idx >= 0) {
                            col.onedit(td, data[idx], val);
                        } else {
                            col.onedit(td, row, val);
                        }
                    }
                });

            }
            if ("onevent" in col) {
                for (let k in col.onevent) {
                    if (k == "render") {
                        col.onevent[k]({ target: td }, row, k);
                    } else {
                        let evt = k.split(":");
                        if (evt.length > 1) {
                            let els = td.querySelectorAll(evt.slice(1).join(':'));
                            for (let l = 0; l < els.length; l++) {
                                els[l].addEventListener(evt[0], (event) => {
                                    col.onevent[k](event, row, k, els[l]);
                                })
                            }
                        } else {
                            td.addEventListener(k, (event) => {
                                col.onevent[k](event, row);
                            });
                        }
                    }
                }
            }
        }
        return tr;
    }

    function set(nd) {
        data = nd;
        tbody.innerHTML = "";
        for (let i = 0; i < data.length; i++) {
            let tr = renderRow(data[i]);
            tbody.appendChild(tr);
        }
        runFilter();
    }

    function get() {
        return data;
    }

    function appendRow(row) {
        let tr = renderRow(row);
        data.push(row);
        tbody.appendChild(tr);
    }

    return {
        refresh,
        set,
        root,
        columns,
        get,
        appendRow,
        renderRow(row) {
            let idx = data.indexOf(row);
            if (idx == -1) throw new Error("Unknown row");
            let td = renderRow(row);
            tbody.replaceChild(td, tbody.children[idx]);
        },
        removeRow(row) {
            let idx = data.indexOf(row);
            if (idx == -1) throw new Error("Unknown row");
            data.splice(idx, 1);
            tbody.removeChild(tbody.children[idx]);
        }
    }
}

function smartmodal(el) {
    let clone = el.cloneNode(true);
    document.body.appendChild(clone);
    let modal = new bootstrap.Modal(clone);
    let onclose = null;
    clone.addEventListener('hidden.bs.modal', () => {
        modal.dispose();
        document.body.removeChild(clone);
        if (onclose) onclose();
    });
    let form = clone.querySelector("form");
    if (form != null) {
        form.addEventListener('keydown', (event) => {
            if (event.key == "Enter") {
                event.preventDefault();
                let btn = clone.querySelector('.modal-footer .btn-primary');
                if (btn != null) {
                    btn.dispatchEvent(new Event('click'));
                }
            } else if (event.key == "Escape") {
                let btn = clone.querySelector('.modal-footer .btn-secondary');
                if (btn != null) {
                    event.preventDefault();
                    btn.dispatchEvent(new Event('click'));
                }
            }
        })
    }
    let ret = {
        title(text) {
            let el = clone.querySelector('.modal-title');
            if (el != null) {
                el.innerHTML = mispaf.escape(text);
            } else {
                head = document.createElement('DIV');
                head.setAttribute("class", "modal-header");
                head.innerHTML = `<h5 class="modal-title">${mispaf.escape(text)}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"
                    aria-label="Close"></button>`;
                let content = clone.querySelector(".modal-content");
                if (content.firstChild) {
                    content.insertBefore(head, content.firstChild);
                } else {
                    content.appendChild(head);
                }
            }

        },
        button(index, action) {
            let btn;
            if (index >= 0) {
                btn = clone.querySelectorAll('.modal-footer button')[index];
            } else {
                btn = clone.querySelector('.btn-close');
            }
            btn.addEventListener('click', (event) => {
                action(event, ret, index);
            });
        },
        modal,
        el: clone,
        show() {
            modal.show();
            if (form != null) {
                let el = form.querySelector("input,textarea,select");
                if (el != null) {
                    el.focus();
                }
            }
        },
        close() { modal.hide(); },
        onclose(c) { onclose = c; }
    }
    return ret;
}

function renderTask(task, slice) {
    if ((new Date(task.creation) <= new Date(slice.start_date)) && slice.locked == 1) {
        return "&#128274;" + mispaf.escape(task.description);
    } else {
        return mispaf.escape(task.description);
    }
}

(() => {
    let thumbsup = document.getElementById("thumbsup");
    function getCount() {
        let v = parseInt(thumbsup.getAttribute("data-count"));
        if (isNaN(v)) return 0;
        return v;
    }
    function setCount(c) {
        thumbsup.setAttribute("data-count", c);
    }
    thumbsup.setAttribute("class", "hidden");
    mispaf.ajaxDefault = {
        type: 'POST',
        pending: document.querySelector(".ajaxcall"),
        mimeType: 'application/json',
        success() {
            setCount(getCount() + 1);
            thumbsup.removeAttribute("class");
            setTimeout(() => {
                let c = getCount() - 1;
                if (c <= 0) {
                    thumbsup.setAttribute("class", "hidden");
                    setCount(0);
                } else {
                    setCount(c);
                }
            }, 100);
        },
        error(msg, status) {
            let disco = (status == 0 && msg == "");
            if (disco) {
                msg = "Server is down.";
            } else if (status == 401) {
                msg = "Disconnected from server.";
            }
            let diag = document.createElement('DIV');
            diag.setAttribute("class", "modal");
            diag.setAttribute("tabindex", "-1");
            diag.innerHTML = `
<div class="modal-dialog">
    <div class="modal-content">
        <div class="modal-body">
            ${mispaf.escape(msg)}
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-primary">Close</button>
        </div>
    </div>
</div>
    `;
            let modal = smartmodal(diag);
            modal.title("Alert");
            modal.button(0, () => {
                if (disco) {
                    location.reload();
                } else if (status == 401) {
                    location.reload();
                }
                modal.close();
            });
            modal.show();
        }
    }
    websocket.ajaxDefault = mispaf.ajaxDefault;
})();

function modalConfirm(msg) {
    let diag = document.createElement('DIV');
    diag.setAttribute("class", "modal");
    diag.setAttribute("tabindex", "-1");
    diag.innerHTML = `
<div class="modal-dialog">
    <div class="modal-content">
        <div class="modal-body">
            ${mispaf.escape(msg)}
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary">Confirm</button>
        </div>
    </div>
</div>
    `;
    return new Promise((resolve) => {
        let modal = smartmodal(diag);
        modal.title("Please Confirm");
        let confirm = false;
        modal.button(1, () => {
            confirm = true;
            modal.close();
        });
        modal.onclose(() => {
            resolve(confirm);
        });
        modal.show();
    });
}

window.onpopstate = (event) => {
    try {
        mispaf.enableHistory = false;
        mispaf.page(location.hash.substring(1));
        mispaf.enableHistory = true;
    } catch (_) {
        checkWhoAmI();
    }
}

mispaf.addPageListener('enter', () => {
    document.getElementById("sidebarMenu").classList.remove("show");
});


function boardName(n) {
    let idx = n.lastIndexOf("@");
    if (idx != -1) n = n.substring(0, idx);
    n = n.split(".");
    for (let i = 0; i < n.length; i++) {
        if (n[i].length > 1) {
            n[i] = n[i][0].toUpperCase() + n[i].substring(1);
        }
    }
    return n.join(" ");
}

function boardTime(t) {
    let d = new Date(t);
    let dd = d.toLocaleDateString();
    let dt = d.toLocaleTimeString();
    if (dd == new Date().toLocaleDateString()) {
        return "at " + dt;
    }
    return "on " + dd + " at " + dt;
}

let overDropZone = false;

function messageBoard({ el: mdiv, urlcreate, urlforget, urlget, urlcount, urlupload, canSend = false, broadcastListener = false, ajax, extraParams }) {

    let onmessage = () => { };
    let inited = false;
    let selected = null;
    let myself = null;

    function data(d) {
        if (extraParams) {
            let n = extraParams();
            for (let k in n) d[k] = n[k];
        }
        return d;
    }

    function sendMessage() {
        let input = mdiv.querySelector('input');
        if (input == null) return;
        let msg = input.value.trim();
        input.value = "";
        if (msg.length == 0) return;
        ajax({
            url: urlcreate,
            data: data({
                chat: selected,
                msg
            })
        });
    }

    function forget() {
        if (selected != null) {
            let chat = selected;
            selected = null;
            ajax({
                url: urlforget,
                data: data({ chat })
            });
        }
    }

    function broadcast(msg) {
        if (selected == msg.chat) {
            let count = parseInt(mdiv.getAttribute("data-count"));
            if (isNaN(count)) count = 0;
            count++;
            mdiv.setAttribute("data-count", count);
            if (urlcount) {
                ajax({
                    url: urlcount,
                    data: data({ chat: selected, count })
                });
            }
            onmessage(selected, count); // notify
            if (selected == msg.chat) { // still in right chat
                let div = renderMessage(msg);
                appendMessage(div, msg, count);
                if (canSend && document.activeElement == mdiv.querySelector('.senddiv input')) {
                    mdiv.lastChild.scrollIntoView();
                }
            }
        }
    }

    if (canSend === true) {
        mdiv.addEventListener('click', (event) => {
            if (event.target.tagName == "BUTTON" && event.target.classList.contains("send")) {
                sendMessage();
            }
        });

        mdiv.addEventListener('keydown', (event) => {
            if (event.key == "Enter" && event.target.tagName == "INPUT") {
                sendMessage();
            }
        });
    }

    function getResponse(xmlhttp) {
        if (xmlhttp.getResponseHeader('content-type') && xmlhttp.getResponseHeader('content-type').startsWith("application/json")) {
            try {
                return JSON.parse(xmlhttp.responseText);
            } catch (e) {
                if (error !== undefined) {
                    error(xmlhttp.responseText, xmlhttp.status, xmlhttp);
                    success = undefined; error = undefined;
                } else {
                    throw e;
                }
            }
        } else {
            return xmlhttp.responseText;
        }
    }

    function upload(file, ui, success, error) {
        let req = new XMLHttpRequest();
        let div = document.createElement("DIV");
        let aborted = false;
        div.setAttribute("class", "uploading");
        ui.appendChild(div);
        div.innerHTML = `<label>File:</label><div class="progress-container"><progress></progress><span>${mispaf.escape(file.name)}</span></div><button>&#10060; Cancel</button>`;
        function disable(event) {
            event.dataTransfer.effectAllowed = "none";
            event.dataTransfer.dropEffect = "none";
            event.preventDefault();
            event.stopPropagation();
        }
        div.addEventListener("dragenter", disable);
        div.addEventListener("dragover", disable);
        div.addEventListener("dragleave", disable);
        div.addEventListener("dragexit", disable);
        div.addEventListener("drop", disable);
        div.querySelector("button").addEventListener("click", () => {
            try {
                req.abort();
            } catch (_) { }
        });
        let progress = div.querySelector("progress");
        req.upload.addEventListener("loadstart", (event) => {
            progress.setAttribute("max", file.size);
            progress.value = 0;
        });
        req.upload.addEventListener("abort", (event) => {
            aborted = true;
        });
        /*        
                req.upload.addEventListener("error", (event)=>{
                    onFinished(false);
                });
        
                req.upload.addEventListener("timeout", (event)=>{
                    onFinished(false);
                });
                req.upload.addEventListener("load", (event)=>{
                    debugger;
                });*/
        req.upload.addEventListener("progress", (event) => {
            progress.value = event.loaded;
        });
        req.onreadystatechange = function () {
            if (aborted) {
                success(null);
            }
            if (req.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
                div.parentElement.removeChild(div);
                if (req.status == 200) {
                    success(getResponse(req));
                } else {
                    error(getResponse(req), req.status, req);
                }
            }
        }
        req.open("POST", urlupload);
        let form = new FormData();
        form.append("file", file, file.name);
        req.send(form);
    }

    function appendMessage(div, msg, count) {
        if (count > 1) { // merge with previous bubble ?
            let last = mdiv.children[mdiv.children.length - 1 - (canSend === true ? 1 : 0)];
            let hasFile = last.querySelector("a") != null;
            let otime = parseInt(last.getAttribute("data-ts")) / 1000;
            let ouser = last.getAttribute("data-user");
            let ctime = new Date(msg.creation).getTime() / 1000;
            if (msg.user != ouser || ctime - otime > 15 * 60 || (msg.file != null) != hasFile) {
                mdiv.insertBefore(div, mdiv.lastChild);
            } else {
                last.lastChild.appendChild(document.createElement("BR"));
                last.lastChild.appendChild(div.querySelector(".msgcnt").childNodes[0]);
            }
        } else {
            if (canSend) {
                mdiv.insertBefore(div, mdiv.lastChild); // insert before send div
            } else {
                mdiv.appendChild(div); // insert at the end
            }
        }
    }

    function resetMessages() {
        mdiv.innerHTML = '';
        mdiv.setAttribute("data-count", 0);
        let div = null;
        let ouid = null;
        let otime = null;
        /*        for (let i = 0; i < messages.length; i++) {
                    let ctime = new Date(messages[i].creation).getTime() / 1000;
                    let msg = renderMessage(messages[i]);
                    if (messages[i].user != ouid || ctime - otime > 15 * 60) {
                        mdiv.appendChild(msg);
                        div = msg;
                        otime = ctime;
                        ouid = messages[i].user;
                    } else {
                        div.children[1].appendChild(document.createElement("BR"));
                        div.children[1].appendChild(msg.querySelector(".msgcnt").childNodes[0]);
                    }
                }*/
        if (canSend === true) {
            div = document.createElement("DIV");
            div.setAttribute("class", "senddiv");
            div.innerHTML = `<label>Message:</label> <input><button class="send">&#10147; Send</button>`;
            mdiv.appendChild(div);
            let input = div.querySelector("input");
            if (urlupload) {
                let dropzone = document.createElement("DIV");
                dropzone.setAttribute("class", "dropzone");
                div.appendChild(dropzone);
                input.setAttribute("placeholder", "Type message or drop file here...");
                function drop(event) {
                    if (!overDropZone) return;
                    overDropZone = false;
                    div.classList.remove("dragging");
                    event.stopPropagation();
                    event.preventDefault();
                    let count = 0;
                    let files = event.dataTransfer.files;
                    function loop() {
                        if (count >= files.length) return;
                        let file = files[count];
                        count++;
                        upload(file, div, (response) => {
                            if (response == null) {
                                // was aborted => stop here
                                return;
                            }
                            response.chat = selected;
                            ajax({
                                url: urlcreate,
                                data: data(response),
                                success: loop
                            });
                        }, websocket.ajaxDefault.error);
                    }
                    loop();
                }
                dropzone.addEventListener("drop", drop);
                function enter(event) {
                    event.stopPropagation();
                    event.preventDefault();
                    if (overDropZone) return;
                    overDropZone = true;
                    event.dataTransfer.effectAllowed = "copy";
                    event.dataTransfer.dropEffect = "copy";
                    div.classList.add("dragging");
                };
                div.addEventListener("dragenter", enter);
                div.addEventListener("dragover", enter);
                function leave(event) {
                    if (!overDropZone) return;
                    overDropZone = false;
                    event.dataTransfer.effectAllowed = "none";
                    event.dataTransfer.dropEffect = "none";
                    div.classList.remove("dragging");
                    event.stopPropagation();
                    event.preventDefault();
                }
                dropzone.addEventListener("dragleave", leave);
                dropzone.addEventListener("dragend", leave);
            } else {
                input.setAttribute("placeholder", "Type message here...");
            }
        }
    }

    function quoteattr(s, preserveCR) {
        preserveCR = preserveCR ? '&#13;' : '\n';
        return ('' + s) /* Forces the conversion to string. */
            .replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
            .replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            /*
            You may add other replacements here for HTML only 
            (but it's not necessary).
            Or for XML, only if the named entities are defined in its DTD.
            */
            .replace(/\r\n/g, preserveCR) /* Must be before the next replacement. */
            .replace(/[\r\n]/g, preserveCR);
        ;
    }

    function basename(file) {
        let idx = file.lastIndexOf("/");
        if (idx != -1) file = file.substring(idx + 1);
        idx = file.indexOf("_");
        if (idx != -1) file = file.substring(idx + 1);
        return file;
    }

    function renderMessage(m) {
        let div = document.createElement("DIV");
        div.setAttribute("data-ts", new Date(m.creation).getTime());
        div.setAttribute("data-user", m.user);
        if (myself == m.user) { div.setAttribute("class", "myself") };
        if (m.file) {
            div.innerHTML = `
            <div class="msgsrc">${mispaf.escape(m.user)} uploaded ${boardTime(m.creation)}: </div>
            <div class="msgcnt"><a href="${m.file}" download="${quoteattr(basename(m.file))}">${mispaf.escape(basename(m.file))}</a></div>`;
        } else {
            div.innerHTML = `
            <div class="msgsrc">${mispaf.escape(m.user)} wrote ${boardTime(m.creation)}: </div>
            <div class="msgcnt">${mispaf.escape(m.message)}</div>`;
        }
        return div;
    }

    function reconnect(chat) {
        ajax({
            url: urlget,
            data: data({
                chat,
                listen: broadcastListener !== false
            }),
            success(response) {
                let count = parseInt(mdiv.getAttribute("data-count"));
                for (let i = count; i < response.length; i++) {
                    let div = renderMessage(response[i]);
                    appendMessage(div, response[i], i);
                }
                mdiv.setAttribute("data-count", response.length);
                if (urlcount) {
                    ajax(data({
                        url: urlcount,
                        data: data({ chat, count: response.length })
                    }));
                }
                onmessage(chat, response.length);
            },
            reconnect: () => {
                if (selected == chat) reconnect(chat);
            }
        })
    }

    return {
        setBoard(chat) {
            if (inited == false) {
                inited = true;
                if (broadcastListener !== false) broadcastListener(broadcast);
            }
            if (chat == selected) return chat;
            if (chat == null) {
                forget();
                mdiv.innerHTML = '';
            } else {
                selected = chat;
                resetMessages();
                reconnect(chat);
            }
        },
        onmessage(cb) { onmessage = cb; },
        setMyself(name) {
            myself = name;
        }
    }
}

// prevent reacting when dropping files out of a dropzone
window.addEventListener("dragenter", (event) => {
    event.preventDefault();
    if (overDropZone) return;
    event.dataTransfer.effectAllowed = "none";
    event.dataTransfer.dropEffect = "none";
})

window.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (overDropZone) return;
    event.dataTransfer.effectAllowed = "none";
    event.dataTransfer.dropEffect = "none";
})

window.addEventListener("drop", (event) => {
    event.dataTransfer.effectAllowed = "none";
    event.dataTransfer.dropEffect = "none";
    event.preventDefault();
})

const gantt = (() => {

    const palette = ['#5BC0EB', '#FDE74C', '#9BC53D', '#C3423F', '#211A1E', "#a3d9ff", "#7e6b8f", "#96e6b3", "#da3e52", "#f2e94e"];

    //https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
    const pSBC = (p, c0, c1, l) => {
        let r, g, b, P, f, t, h, i = parseInt, m = Math.round, a = typeof (c1) == "string";
        if (typeof (p) != "number" || p < -1 || p > 1 || typeof (c0) != "string" || (c0[0] != 'r' && c0[0] != '#') || (c1 && !a)) return null;
        if (!this.pSBCr) this.pSBCr = (d) => {
            let n = d.length, x = {};
            if (n > 9) {
                [r, g, b, a] = d = d.split(","), n = d.length;
                if (n < 3 || n > 4) return null;
                x.r = i(r[3] == "a" ? r.slice(5) : r.slice(4)), x.g = i(g), x.b = i(b), x.a = a ? parseFloat(a) : -1
            } else {
                if (n == 8 || n == 6 || n < 4) return null;
                if (n < 6) d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (n > 4 ? d[4] + d[4] : "");
                d = i(d.slice(1), 16);
                if (n == 9 || n == 5) x.r = d >> 24 & 255, x.g = d >> 16 & 255, x.b = d >> 8 & 255, x.a = m((d & 255) / 0.255) / 1000;
                else x.r = d >> 16, x.g = d >> 8 & 255, x.b = d & 255, x.a = -1
            } return x
        };
        h = c0.length > 9, h = a ? c1.length > 9 ? true : c1 == "c" ? !h : false : h, f = this.pSBCr(c0), P = p < 0, t = c1 && c1 != "c" ? this.pSBCr(c1) : P ? { r: 0, g: 0, b: 0, a: -1 } : { r: 255, g: 255, b: 255, a: -1 }, p = P ? p * -1 : p, P = 1 - p;
        if (!f || !t) return null;
        if (l) r = m(P * f.r + p * t.r), g = m(P * f.g + p * t.g), b = m(P * f.b + p * t.b);
        else r = m((P * f.r ** 2 + p * t.r ** 2) ** 0.5), g = m((P * f.g ** 2 + p * t.g ** 2) ** 0.5), b = m((P * f.b ** 2 + p * t.b ** 2) ** 0.5);
        a = f.a, t = t.a, f = a >= 0 || t >= 0, a = f ? a < 0 ? t : t < 0 ? a : a * P + t * p : 0;
        if (h) return "rgb" + (f ? "a(" : "(") + r + "," + g + "," + b + (f ? "," + m(a * 1000) / 1000 : "") + ")";
        else return "#" + (4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0)).toString(16).slice(1, f ? undefined : -2)
    }

    const darkPalette = [];
    for (let i = 0; i < palette.length; i++) {
        darkPalette.push(pSBC(-0.4, palette[i]));
    }

    function create(el) {
        const DAY = 1000 * 60 * 60 * 24;
        let referenceDate = 0;
        let tasks = [];
        function toDate(d) {
            return new Date(d).toLocaleDateString();
        }
        let old = {};


        const barOptions_stacked = {
            hover: {
                animationDuration: 10
            },
            scales: {
                xAxes: [{
                    label: "Duration",
                    ticks: {
                        beginAtZero: true,
                        fontFamily: "'Open Sans Bold', sans-serif",
                        fontSize: 11
                    },
                    scaleLabel: {
                        display: false
                    },
                    gridLines: {
                    },
                    stacked: true,
                    ticks: {
                        callback(val, index) {
                            let d = new Date();
                            d.setTime((referenceDate + val) * DAY);
                            return d.toLocaleDateString();
                        }
                    }
                }],
                yAxes: [{
                    gridLines: {
                        display: false,
                        color: "#fff",
                        zeroLineColor: "#fff",
                        zeroLineWidth: 0
                    },
                    ticks: {
                        fontFamily: "'Open Sans Bold', sans-serif",
                        fontSize: 11
                    },
                    stacked: true
                }]
            },
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    title(context) {
                        let c = context[0];
                        return c.label + "\n" + toDate(tasks[c.index].start_date) + "\n" + toDate(tasks[c.index].end_date);
                    },
                    label() {
                        return "";
                    }
                }
            }
        };

        function refreshGantt(data) {
            let oldtasks = tasks;
            tasks = [];
            let min = Number.MAX_VALUE;
            let today = Math.floor(new Date().getTime() / DAY);
            for (let i = 0; i < data.length; i++) {
                let row = data[i];
                if (row.start_date != null && row.end_date != null) {
                    let sd = Math.floor(new Date(row.start_date).getTime() / DAY);
                    let ed = Math.floor(new Date(row.end_date).getTime() / DAY);
                    if (ed < sd) continue;
                    tasks.push({
                        label: row.description.substring(0, Math.min(20, row.description.length)),
                        start_date: row.start_date,
                        end_date: row.end_date,
                        sd,
                        ed
                    });
                    if (sd < min) min = sd;
                }
            }
            if (tasks.length == 0) {
                el.style.display = "none";
                if ("gantt" in old) {
                    old.gantt.destroy();
                    delete old.gantt;
                }
            } else {
                if (tasks.length == oldtasks.length) {
                    let same = true;
                    for (let i = 0; i < tasks.length; i++) {
                        if (tasks[i].label != oldtasks[i].label) same = false;
                        if (tasks[i].start_date != oldtasks[i].start_date) same = false;
                        if (tasks[i].end_date != oldtasks[i].end_date) same = false;
                        if (tasks[i].sd != oldtasks[i].sd) same = false;
                        if (tasks[i].ed != oldtasks[i].ed) same = false;
                        if (!same) break;
                    }
                    if (same) return;
                }
                if ("gantt" in old) {
                    old.gantt.destroy();
                    delete old.gantt;
                }

                el.style.display = "block";

                referenceDate = min;
                let labels = [];
                let skip = [];
                let before = [];
                let after = [];
                for (let i = 0; i < tasks.length; i++) {
                    labels.push(tasks[i].label);
                    skip.push(tasks[i].sd - min);
                    if (tasks[i].ed < today) {
                        before.push(tasks[i].ed - tasks[i].sd + 1);
                        after.push(0);
                    } else if (tasks[i].sd > today) {
                        before.push(0);
                        after.push(tasks[i].ed - tasks[i].sd + 1);
                    } else {
                        before.push(today - tasks[i].sd);
                        after.push(tasks[i].ed - today + 1);
                    }
                }


                old.gantt = new Chart(el, {
                    type: 'horizontalBar',
                    data: {
                        labels,
                        datasets: [{
                            data: skip,
                            backgroundColor: "rgba(63,103,126,0)",
                            hoverBackgroundColor: "rgba(50,90,100,0)"

                        }, {
                            data: before,
                            backgroundColor: darkPalette,
                        }, {
                            data: after,
                            backgroundColor: palette,
                        }]
                    },
                    options: barOptions_stacked
                });
            }
        }

        return {
            refresh: refreshGantt
        }
    }

    return {
        create,
        destroy() {
            if ("gantt" in old) {
                old.gantt.destroy();
                tasks = [];
                delete old.gantt;
            }
        },
        palette,
        darkPalette
    }

})();

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

const progress = ((config) => {
    let root = config.root;
    if (!root.classList.contains("progress")) root.classList.add("progress");
    function set(v) {
        root.innerHTML = "";
        let count = v.length;
        if (count == 0) {
            root.innerHTML = "No task yet";
            root.setAttribute("data-actual", 0);
            return;
        }
        let actual = 0;
        for (let i = 0; i < count; i++) actual += v[i].length;
        if (actual == 0) { // cannot make any estimate
            for (let i = 0; i < count; i++) {
                let span = document.createElement("SPAN");
                span.style.width = (100 / count) + "%";
                span.innerText = v[i].description;
                span.setAttribute("title", v[i].description);
                span.classList.add("unknown");
                root.appendChild(span);
            }
            root.setAttribute("data-actual", 0);
            return;
        }
        // split between those with some length and those without
        let g1 = [], g2 = [], g3 = [];
        let estimated = 0;
        let minprogress = 100;
        for (let i = 0; i < count; i++) {
            if (v[i].length == 0) {
                g2.push({
                    description: v[i].description,
                    length: 0,
                    progress: 0,
                    unknown: true
                });
            } else if (v[i].progress == 0) {
                g3.push({
                    description: v[i].description,
                    length: v[i].length,
                    progress: 0,
                    unknown: true
                });
            } else {
                minprogress = Math.min(minprogress, v[i].progress);
                let e = (100 / v[i].progress) * v[i].length;
                g1.push({
                    description: v[i].description,
                    length: v[i].length,
                    progress: v[i].progress,
                    estimate: e
                });
                estimated += e;
            }
        }
        // for the tasks with no length, we estimate them by using the mean of estimated tasks
        for (let i = 0; i < g2.length; i++) {
            g2[i].estimate = estimated / g1.length;
        }
        // for the tasks with no progress, we estimate them by minprogress
        for (let i = 0; i < g3.length; i++) {
            let e = (100 / minprogress) * g3[i].length;
            g3[i].estimate = e;
            estimated += e;
        }
        g1.sort((a, b) => b.length / b.estimate - a.length / a.estimate);
        g1.push.apply(g1, g3);
        // update estimated
        estimated = estimated + (estimated / g1.length) * g2.length;
        // now sort g2, most finished first
        // append g2 to g1
        g1.push.apply(g1, g2);
        // build result
        for (let i = 0; i < g1.length; i++) {
            let span = document.createElement("SPAN");
            span.style.width = (g1[i].estimate / estimated) * 100 + "%";
            span.innerText = g1[i].description;
            span.setAttribute("title", g1[i].description + " " + g1[i].progress + "% " + g1[i].length + "min");
            if (g1[i].unknown === true) {
                span.classList.add("unknown");
            } else {
                let progress = g1[i].length / g1[i].estimate;
                let r, g;
                if (progress < 0.5) {
                    r = 255;
                    g = Math.round(255 * (progress * 2));
                } else {
                    g = 255;
                    r = Math.round(255 * ((1 - progress) * 2))
                }
                span.style.backgroundColor = rgbToHex(r, g, 0);
            }
            root.appendChild(span);
        }
        root.setAttribute("data-actual", actual);
    }


    return {
        set
    }
})