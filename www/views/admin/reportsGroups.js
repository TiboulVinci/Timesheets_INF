(() => {

    let universeSelect = document.querySelector('#groupReports select[name="universe"]');
    let universes = {};

    let groupSelect = document.querySelector('#groupReports select[name="group"]');
    let groups = {}

    feather.replace({ 'aria-hidden': 'true' })

    let old = {};
    function getUniverse() {
        return parseInt(universeSelect.value);
    }
    function getGroup() {
        return parseInt(groupSelect.value);
    }

    function clear() {
        if ("groupSlice" in old) {
            old.groupSlice.destroy();
            delete old.groupSlice;
        }

        if ("groupShare" in old) {
            old.groupShare.destroy();
            delete old.groupShare;
        }
    }

    function refresh() {
        clear();
        let gid = getGroup();
        if (isNaN(gid)) return;
        mispaf.ajax({
            url: "reports/groupReport",
            data: { universe_id: getUniverse(), group_id: getGroup() },
            success(response) {
                let labels = [];
                for (let k in response.slices) {
                    labels.push(response.slices[k].name);
                }
                let peruser = {};
                for (let i = 0; i < response.data.length; i++) {
                    let e = response.data[i];
                    if (!(e.login in peruser)) {
                        peruser[e.login] = {};
                    }
                    peruser[e.login][e.slice_id] = e.length;
                }
                let datasets = [];
                let idx = 0;
                for (let u in peruser) {
                    let data = [];
                    for (let k in response.slices) {
                        data.push(peruser[u][k] || 0);
                    }
                    let color = getPaletteColor(idx);
                    idx++;
                    datasets.push({
                        data,
                        label: u,
                        lineTension: 0,
                        backgroundColor: 'transparent',
                        borderColor: color,
                        borderWidth: 4,
                        pointBackgroundColor: color
                    })
                }

                old.groupSlice = new Chart(document.getElementById('groupSlice'), {
                    type: 'line',
                    data: {
                        labels,
                        datasets
                    },
                    options: {
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true
                                }
                            }]
                        },
                        legend: {
                            display: true
                        }
                    }
                })

                let data = [];
                for (let u in peruser) {
                    let total = 0;
                    for (let k in response.slices) {
                        total += peruser[u][k] || 0;
                    }
                    data.push(total);
                }

                old.groupShare = new Chart(document.getElementById('groupShare'), {
                    type: 'pie',
                    data: {
                        labels: Object.keys(peruser),
                        datasets: [
                            {
                                data,
                                backgroundColor: getPaletteColors(data.length)
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: false
                            }
                        }
                    }
                })

            }
        })
    }

    function refreshGroups() {
        let uid = getUniverse();
        groupSelect.innerHTML = '';
        clear();
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

    universeSelect.addEventListener('change', () => {
        localStorage.setItem("universe_id", universeSelect.value);
        refreshUniverse();
    });

    function setGroup() {
        refresh();
        let memel = document.querySelector('#groupReports .members');
        memel.innerHTML = '';
        if (!isNaN(getUniverse()) && !isNaN(getGroup())) {
            listUsersInGroup(memel, getUniverse, getGroup);
        }
    }

    groupSelect.addEventListener('change', () => {
        localStorage.setItem("group_id", getGroup());
        setGroup();
    });

    mispaf.addPageListener('enter:groupReports', refreshUniverse);

})()
