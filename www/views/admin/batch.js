const batch = {
    universes: {},
    async checkDeleteAccount(target) {
        let tr = mispaf.parentElement(target, 'tr');
        let login = tr.querySelector('td:first-child').innerText;
        return new Promise((resolve, reject) => {
            mispaf.ajax({
                url: 'users/getUserByLogin',
                data: { login },
                success(response) {
                    if (response == null) {
                        batch.invalidate(target, "User does not exists");
                    } else {
                        let u = [];
                        for (let i = 0; i < response.universes.length; i++) {
                            u.push(batch.universes[response.universes[i]].name);
                        }
                        if (u.length == 0) {
                            tr.children[1].innerText = "User exists in no universe";
                        } else {
                            tr.children[1].innerText = u.join(' / ')
                        }
                    }
                    resolve();
                },
                error(msg) {
                    batch.invalidate(target, msg);
                    resolve();
                }
            })
        });
    },
    async checkCreateAccount(target) {
        let tr = mispaf.parentElement(target, 'tr');
        let login = tr.querySelector('td:first-child').innerText;
        return new Promise((resolve, reject) => {
            mispaf.ajax({
                url: 'users/getUserByLogin',
                data: { login },
                success(response) {
                    if (response == null) {
                        tr.children[1].innerText = "User does not exists";
                    } else {
                        let u = [];
                        for (let i = 0; i < response.universes.length; i++) {
                            u.push(batch.universes[response.universes[i]].name);
                        }
                        if (u.length == 0) {
                            batch.invalidate(target, "User exists in no universe");
                        } else {
                            batch.invalidate(target, u.join(" / "));
                        }
                    }
                    resolve();
                },
                error(msg) {
                    batch.invalidate(target, msg);
                    resolve();
                }
            })
        });
    },
    async checkAddUniverse(target) {
        let universe_id=parseInt(document.querySelector('#batchselectaction select').value);
        let tr = mispaf.parentElement(target, 'tr');
        let login = tr.querySelector('td:first-child').innerText;
        return new Promise((resolve, reject) => {
            mispaf.ajax({
                url: 'users/getUserByLogin',
                data: { login },
                success(response) {
                    if (response == null) {
                        batch.invalidate(target,"User does not exists");
                    } else {
                        let u = [];
                        let already=false;
                        for (let i = 0; i < response.universes.length; i++) {
                            if (response.universes[i]==universe_id) already=true;
                            u.push(batch.universes[response.universes[i]].name);
                        }
                        if (already) {
                            batch.invalidate(target,"User already in this universe");
                        } else {
                            if (u.length == 0) {
                                tr.children[1].innerText ="User exists in no universe";
                            } else {
                                tr.children[1].innerText = u.join(" / ");
                            }    
                        }
                    }
                    resolve();
                },
                error(msg) {
                    batch.invalidate(target, msg);
                    resolve();
                }
            })
        });
    },
    async checkRemoveUniverse(target) {
        let universe_id=parseInt(document.querySelector('#batchselectaction select').value);
        let tr = mispaf.parentElement(target, 'tr');
        let login = tr.querySelector('td:first-child').innerText;
        return new Promise((resolve, reject) => {
            mispaf.ajax({
                url: 'users/getUserByLogin',
                data: { login },
                success(response) {
                    if (response == null) {
                        batch.invalidate(target,"User does not exists");
                    } else {
                        let u = [];
                        let already=false;
                        for (let i = 0; i < response.universes.length; i++) {
                            if (response.universes[i]==universe_id) already=true;
                            u.push(batch.universes[response.universes[i]].name);
                        }
                        if (!already) {
                            batch.invalidate(target,"User absent from universe");
                        } else {
                            tr.children[1].innerText = u.join(" / ");
                        }
                    }
                    resolve();
                },
                error(msg) {
                    batch.invalidate(target, msg);
                    resolve();
                }
            })
        });
    },
    async createAccount(target) {
        let tr = mispaf.parentElement(target, 'tr');
        let login = tr.querySelector('td:first-child').innerText;
        return new Promise((resolve, reject) => {
            mispaf.ajax({
                url: 'auth/register',
                type: 'POST',
                data: {
                    login,
                    password1: document.querySelector('#batchselectaction input[name="password1"]').value,
                    password2: document.querySelector('#batchselectaction input[name="password2"]').value
                },
                success(response) {
                    batch.validate(target, "User created");
                    resolve();
                },
                error(msg) {
                    batch.invalidate(target, msg);
                    resolve();
                }
            })
        });
    },
    async deleteAccount(target) {
        let tr = mispaf.parentElement(target, 'tr');
        let login = tr.querySelector('td:first-child').innerText;
        return new Promise((resolve, reject) => {
            mispaf.ajax({
                url: 'users/getUserByLogin',
                type: 'POST',
                data: {
                    login
                },
                success(response) {
                    if (response != null) {
                        mispaf.ajax({
                            url: 'users/delete',
                            type: 'POST',
                            data: {
                                user_id: response.user_id
                            },
                            success(response) {
                                batch.validate(target, "User deleted");
                                resolve();
                            },
                            error(msg) {
                                batch.invalidate(target, msg);
                                resolve();
                            }
                        })
                    } else {
                        batch.invalidate(target, "User already deleted");
                        resolve();
                    }
                },
                error(msg) {
                    batch.invalidate(target, msg);
                    resolve();
                }
            })
        });
    },
    async addUniverse(target) {
        let tr = mispaf.parentElement(target, 'tr');
        let login = tr.querySelector('td:first-child').innerText;
        return new Promise((resolve, reject) => {
            mispaf.ajax({
                url: 'users/getUserByLogin',
                type: 'POST',
                data: {
                    login
                },
                success(response) {
                    if (response != null) {
                        let universes=response.universes;
                        let universe_id=parseInt(document.querySelector('#batchselectaction select').value);
                        if (universes.indexOf(universe_id)!=-1) {
                            batch.validate(target, "User already in universe");
                            resolve();
                            return;
                        }
                        universes.push(universe_id);
                        mispaf.ajax({
                            url: 'users/universes',
                            type: 'POST',
                            data: {
                                user_id: response.user_id,
                                universes
                            },
                            success() {
                                batch.validate(target, "User added to universe");
                                resolve();
                            },
                            error(msg) {
                                batch.invalidate(target, msg);
                                resolve();
                            }
                        })
                    } else {
                        batch.invalidate(target, "User deleted");
                        resolve();
                    }
                },
                error(msg) {
                    batch.invalidate(target, msg);
                    resolve();
                }
            })
        });
    },
    async removeUniverse(target) {
        let tr = mispaf.parentElement(target, 'tr');
        let login = tr.querySelector('td:first-child').innerText;
        return new Promise((resolve, reject) => {
            mispaf.ajax({
                url: 'users/getUserByLogin',
                type: 'POST',
                data: {
                    login
                },
                success(response) {
                    if (response != null) {
                        let universes=response.universes;
                        let universe_id=parseInt(document.querySelector('#batchselectaction select').value);
                        if (universes.indexOf(universe_id)==-1) {
                            batch.validate(target, "User not in universe");
                            resolve();
                            return;
                        }
                        universes.splice(universes.indexOf(universe_id),1);
                        mispaf.ajax({
                            url: 'users/universes',
                            type: 'POST',
                            data: {
                                user_id: response.user_id,
                                universes
                            },
                            success() {
                                batch.validate(target, "User removed from universe");
                                resolve();
                            },
                            error(msg) {
                                batch.invalidate(target, msg);
                                resolve();
                            }
                        })
                    } else {
                        batch.invalidate(target, "User deleted");
                        resolve();
                    }
                },
                error(msg) {
                    batch.invalidate(target, msg);
                    resolve();
                }
            })
        });
    },
    remove(target) {
        let tr = mispaf.parentElement(target, 'tr');
        tr.parentElement.removeChild(tr);
        tr = document.querySelector('#batchactions tbody tr');
        if (!tr) {
            document.getElementById('batchactions').style.display = 'none';
        }
    },
    invalidate(target, msg) {
        let tr = mispaf.parentElement(target, 'tr');
        tr.children[1].innerText = msg;
        tr.children[1].classList.add('invalid');
        let els = tr.querySelectorAll('button.btn');
        for (let i = 0; i < els.length; i++) {
            els[i].parentElement.removeChild(els[i]);
        }
        els = tr.querySelectorAll('[data-fix]');
        for (let i = 0; i < els.length; i++) {
            els[i].removeAttribute('data-fix');
        }
    },
    validate(target, msg) {
        let tr = mispaf.parentElement(target, 'tr');
        tr.children[1].innerText = msg;
        tr.children[1].classList.add('valid');
        let els = tr.querySelectorAll('button.btn');
        for (let i = 0; i < els.length; i++) {
            els[i].parentElement.removeChild(els[i]);
        }
        els = tr.querySelectorAll('[data-fix]');
        for (let i = 0; i < els.length; i++) {
            els[i].removeAttribute('data-fix');
        }
    }
};

(() => {

    let ta = document.querySelector('#batch textarea');
    let ba = document.getElementById('batchactions');
    let table = document.querySelector('#batchactions tbody');

    const setup = {
        createaccounts() {
            let password1 = document.querySelector('#batchselectaction input[name="password1"]').value;
            let password2 = document.querySelector('#batchselectaction input[name="password2"]').value;
            password1 = password1.trim();
            if (password1 == "") {
                mispaf.ajaxDefault.error("Missing password.");
                setupAction(null);
                return;
            } else if (password1 != password2) {
                mispaf.ajaxDefault.error("Passwords are different.");
                setupAction(null);
                return;
            } else if (password1.length < 8) {
                mispaf.ajaxDefault.error("Password is too short (8+).");
                setupAction(null);
                return;
            }
            let emails = getEmails();
            for (let i = 0; i < emails.length; i++) {
                let tr = document.createElement('TR');
                let td = document.createElement('TD');
                td.innerText = emails[i];
                tr.appendChild(td);
                td = document.createElement('TD');
                td.setAttribute('data-fix', `checkCreateAccount`);
                tr.appendChild(td);
                td = document.createElement('TD');
                td.innerHTML = `<button class="btn btn-secondary" onclick="batch.createAccount(this)">Create Account</button>&nbsp;<button class="icon" onclick="batch.remove(this)">&#128465;</button>`;
                tr.appendChild(td);
                table.appendChild(tr);
            }
            fixTable();
        },
        deleteaccounts() {
            let emails = getEmails();
            for (let i = 0; i < emails.length; i++) {
                let tr = document.createElement('TR');
                let td = document.createElement('TD');
                td.innerText = emails[i];
                tr.appendChild(td);
                td = document.createElement('TD');
                td.setAttribute('data-fix', `checkDeleteAccount`);
                tr.appendChild(td);
                td = document.createElement('TD');
                td.innerHTML = `<button class="btn btn-secondary" onclick="batch.deleteAccount(this)">Delete Account</button>&nbsp;<button class="icon" onclick="batch.remove(this)">&#128465;</button>`;
                tr.appendChild(td);
                table.appendChild(tr);
            }
            fixTable();
        },
        removeuniverse() {
            let universe_id=parseInt(document.querySelector('#batchselectaction select').value);
            if (isNaN(universe_id)) {
                mispaf.ajaxDefault.error("No universe available.");
                setupAction(null);
                return;
            }
            let emails = getEmails();
            for (let i = 0; i < emails.length; i++) {
                let tr = document.createElement('TR');
                let td = document.createElement('TD');
                td.innerText = emails[i];
                tr.appendChild(td);
                td = document.createElement('TD');
                td.setAttribute('data-fix', `checkRemoveUniverse`);
                tr.appendChild(td);
                td = document.createElement('TD');
                td.innerHTML = `<button class="btn btn-secondary" onclick="batch.removeUniverse(this)">Remove universe</button>&nbsp;<button class="icon" onclick="batch.remove(this)">&#128465;</button>`;
                tr.appendChild(td);
                table.appendChild(tr);
            }
            fixTable();
        },
        adduniverse() {
            let universe_id=parseInt(document.querySelector('#batchselectaction select').value);
            if (isNaN(universe_id)) {
                mispaf.ajaxDefault.error("No universe available.");
                setupAction(null);
                return;
            }
            let emails = getEmails();
            for (let i = 0; i < emails.length; i++) {
                let tr = document.createElement('TR');
                let td = document.createElement('TD');
                td.innerText = emails[i];
                tr.appendChild(td);
                td = document.createElement('TD');
                td.setAttribute('data-fix', `checkAddUniverse`);
                tr.appendChild(td);
                td = document.createElement('TD');
                td.innerHTML = `<button class="btn btn-secondary" onclick="batch.addUniverse(this)">Add universe</button>&nbsp;<button class="icon" onclick="batch.remove(this)">&#128465;</button>`;
                tr.appendChild(td);
                table.appendChild(tr);
            }
            fixTable();
         },
    }

    async function fixTable() {
        let fixes = table.querySelectorAll('[data-fix]');
        for(let i=0; i<fixes.length; i++) {
            if (document.body.contains(fixes[i])) {
                let fix=fixes[i];
                let a = fix.getAttribute('data-fix');
                fix.removeAttribute('data-fix');
                await batch[a](fix);
            }
        }
    }


    function setupAction(act) {
        let cur = document.querySelector('#batch button.btn-primary');
        if (cur) {
            cur.classList.remove('btn-primary');
            cur.classList.add('btn-secondary');
        }
        table.innerHTML = '';
        if (act == null) {
            ba.style.display = 'none';
        } else {
            mispaf.ajax({
                url: "universes/list",
                type: 'POST',
                success(response) {
                    batch.universes = {};
                    for (let i = 0; i < response.length; i++) {
                        batch.universes[response[i].universe_id] = response[i];
                    }
                    let but = document.querySelector('#batch .' + act);
                    but.classList.remove('btn-secondary');
                    but.classList.remove('btn-primary');
                    but.classList.add('btn-primary');
                    ba.style.display = 'inherit';
                    setup[act]();
                }
            })
        }
    }

    setupAction(null);

    function getCleared() {
        return new Promise((resolve, reject) => {
            mispaf.ajax({
                url: "batch/emailsFilter",
                type: 'POST',
                success(response) {
                    let current = ta.value;
                    let emails = current.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) || [];
                    for (let i = emails.length - 1; i >= 0; i--) {
                        let valid = false;
                        for (let j = 0; j < response.length; j++) {
                            if (emails[i].endsWith(response[j])) {
                                let short = emails[i].substring(0, emails[i].length - response[j].length);
                                if (short.indexOf(" ") != -1) break; // cannot contain space
                                if (short.length == 0) break; // empty email
                                let ishort = parseInt(short);
                                if (!isNaN(ishort) && (ishort + "" == short)) {
                                    break; // number only email
                                }
                                valid = true;
                                break;
                            }
                        }
                        if (!valid) emails.splice(i, 1);
                    }
                    resolve(emails.join('\n'));
                },
                error(msg) {
                    mispaf.ajaxDefault.error(msg);
                    reject(msg);
                }
            })
        });
    }

    async function clear() {
        ta.value = await getCleared();
    }

    async function assertCleaned() {
        let current = ta.value;
        let cleaned = await getCleared();
        if (current.trim() != cleaned.trim()) {
            mispaf.ajaxDefault.error("Please clean emails before proceeding");
            return false;
        }
        return true;
    }

    function getEmails() {
        let current = ta.value.split('\n');
        if (current.length == 1 && current[0] == "") current.splice(0, 1);
        return current;
    }

    function addRemoveUsers(addMode) {
        return async function (event) {
            if (!await assertCleaned()) return;
            let modal = smartmodal(mispaf.parentElement(event.target, '.page').querySelector('.modal.addremoveusers'));
            modal.title(addMode ? "Add users" : "Remove users");
            modal.button(1, () => {
                mispaf.ajax({
                    url: "users/listu",
                    type: 'POST',
                    data: { universe_id: parseInt(universeSelect.value) },
                    success(response) {
                        for (let i = response.length - 1; i >= 0; i--) {
                            if (response[i].admin == 1 || response[i].validated != 1) {
                                response.splice(i, 1);
                            }
                        }
                        let current = getEmails();
                        if (addMode) {
                            for (let i = 0; i < response.length; i++) {
                                if (current.indexOf(response[i].login) == -1) {
                                    current.push(response[i].login);
                                }
                            }
                        } else {
                            for (let i = 0; i < response.length; i++) {
                                let idx = current.indexOf(response[i].login);
                                if (idx != -1) {
                                    current.splice(idx, 1);
                                }
                            }
                        }
                        ta.value = current.join('\n');
                        modal.close();
                    }
                })
            })
            modal.show();
            let universeSelect = modal.el.querySelector('select');
            mispaf.ajax({
                url: "universes/list",
                type: 'POST',
                success(response) {
                    universes = {};
                    universeSelect.innerHTML = '<option value="-1">Select users in no universe</option>';
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
                        universeSelect.appendChild(option);
                    }
                }
            })
        }
    }

    document.querySelector('#batch button.cleartext').addEventListener("click", () => {
        ta.value = "";
        setupAction(null);
    });
    document.querySelector('#batch button.cleantext').addEventListener("click", clear);
    document.querySelector('#batch button.addusers').addEventListener("click", addRemoveUsers(true));
    document.querySelector('#batch button.removeusers').addEventListener("click", addRemoveUsers(false));
    document.getElementById('applyactions').addEventListener("click", async () => {
        let buts = document.querySelectorAll('#batchactions table button.btn');
        for (let i = 0; i < buts.length; i++) {
            if (!document.body.contains(buts[i])) continue; // skip buttons removed since we started
            // dispatching an onclick event would trigger all clicks at once
            // instead, we will wait for each click to resolve
            let onclick = buts[i].getAttribute("onclick");
            if (onclick && onclick.endsWith("(this)") && onclick.startsWith("batch.")) {
                onclick = onclick.substring(6, onclick.length - 6);
                await batch[onclick](buts[i]);
            }
        }
    });

    let actions = document.querySelectorAll('#batchselectaction button');
    for (let i = 0; i < actions.length; i++) {
        actions[i].addEventListener("click", async (event) => {
            if (!await assertCleaned()) return;
            let current = getEmails();
            if (current.length == 0) {
                mispaf.ajaxDefault.error("Select some users first.");
                return;
            }
            let clss = [...event.target.classList];
            for (let i = 0; i < clss.length; i++) {
                if (clss[i].startsWith("btn")) continue;
                setupAction(clss[i]);
                break;
            }
        });
    }

    mispaf.addPageListener('enter:batch', () => {
        ta.value = "";
        document.querySelector('#batch input[name="password1"]').value = "";
        document.querySelector('#batch input[name="password2"]').value = "";
        let select=document.querySelector('#batchselectaction select');
        select.innerHTML='';
        mispaf.ajax({
            url: "universes/list",
            type: 'POST',
            success(response) {
                for (let i = 0; i < response.length; i++) {
                    let option=document.createElement('OPTION');
                    option.value=response[i].universe_id;
                    option.innerText=response[i].name;
                    select.appendChild(option);
                }
            }
        })
    });
})();