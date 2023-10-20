(() => {

    let universeSelect = document.querySelector('#globalReports select[name="universe"]');
    let universes = {};

    let describe = (function () {
        // sort array ascending
        const asc = arr => arr.sort((a, b) => a - b);

        const sum = arr => arr.reduce((a, b) => a + b, 0);

        const mean = arr => sum(arr) / arr.length;

        // sample standard deviation
        const std = (arr) => {
            const mu = mean(arr);
            const diffArr = arr.map(a => (a - mu) ** 2);
            return Math.sqrt(sum(diffArr) / (arr.length - 1));
        };

        const quantile = (arr, q) => {
            const sorted = asc(arr);
            const pos = (sorted.length - 1) * q;
            const base = Math.floor(pos);
            const rest = pos - base;
            if (sorted[base + 1] !== undefined) {
                return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
            } else {
                return sorted[base];
            }
        };

        const q25 = arr => quantile(arr, .25);

        const q50 = arr => quantile(arr, .50);

        const q75 = arr => quantile(arr, .75);

        const median = arr => q50(arr);
        return {
            sum,
            mean,
            q25,
            median,
            q75
        }
    })();



    feather.replace({ 'aria-hidden': 'true' })

    let old = {};
    function getUniverse() {
        return parseInt(universeSelect.value);
    }

    function refreshGlobal() {
        if ("globalSlice" in old) {
            old.globalSlice.destroy();
            delete old.globalSlice;
        }

        if ("globalShare" in old) {
            old.globalShare.destroy();
            delete old.globalShare;
        }

        mispaf.ajax({
            url: "reports/globalReport",
            data: { universe_id: getUniverse() },
            success(response) {
                let labels = [];
                for (let k in response.slices) {
                    labels.push(response.slices[k].name);
                }
                let pergroup = {};
                let groupname = {};
                let userscount = {};
                for (let i = 0; i < response.data.length; i++) {
                    let e = response.data[i];
                    if (!(e.group_id in pergroup)) {
                        pergroup[e.group_id] = {};
                        groupname[e.group_id] = e.name;
                        userscount[e.group_id] = [];
                    }
                    pergroup[e.group_id][e.slice_id] = e.length;
                    userscount[e.group_id].push(e.userscount);
                }
                let datasets = [];
                let colors = [];
                let idx = 0;
                for (let u in pergroup) {
                    let data = [];
                    for (let k in response.slices) {
                        data.push(pergroup[u][k] || 0);
                    }
                    let color = getPaletteColor(idx);
                    colors[u] = color;
                    idx++;
                    datasets.push({
                        data,
                        label: groupname[u],
                        lineTension: 0,
                        backgroundColor: 'transparent',
                        borderColor: color,
                        borderWidth: 4,
                        pointBackgroundColor: color,
                        group_id: u
                    })
                }

                old.globalSlice = new Chart(document.getElementById('globalSlice'), {
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

                for (let g in userscount) { // compute rounded number of students for each group
                    userscount[g] = Math.round(userscount[g].reduce((a, b) => a + b, 0) / userscount[g].length);
                }


                for (let i = 0; i < datasets.length; i++) { // compute average time spent by student for each group
                    for (let j = 0; j < datasets[i].data.length; j++) {
                        datasets[i].data[j] = datasets[i].data[j] / userscount[datasets[i].group_id];
                    }
                }

                datasets.sort((a, b) => b.data.reduce((a, b) => a + b, 0) - a.data.reduce((a, b) => a + b, 0)); // sort most spent times first

                let datasets2 = [];
                for (let i = 0; i < labels.length; i++) {
                    let data = [];
                    for (let j = 0; j < datasets.length; j++) {
                        data.push(datasets[j].data[i]);
                    }
                    datasets2.push({
                        label: labels[i],
                        data: data,
                        backgroundColor: getPaletteColor(i),
                        stack: 'Stack 0'
                    });
                }
                let stats = [];
                for (let i = 0; i < datasets.length; i++) {
                    stats.push(datasets[i].data.reduce((a, b) => a + b, 0));
                }
                function toArr(v) {
                    let ret = [];
                    for (let i = 0; i < datasets.length; i++) {
                        ret.push(v);
                    }
                    return ret;
                }
                datasets2.unshift({
                    data: toArr(describe.mean(stats)),
                    type: "line",
                    label: "Average",
                    fill:false,
                    borderColor:'rgba(0,255,0,0.2)',
                    pointRadius:1
                });
                datasets2.unshift({
                    data: toArr(describe.median(stats)),
                    type: "line",
                    label: "Median",
                    fill:false,
                    borderColor:'rgba(0,0,255,0.2)',
                    pointRadius:1
                });
/*                datasets2.unshift({
                    data: toArr(describe.q25(stats)),
                    type: "line",
                    label: "Quantile 25",
                    fill:false,
                    borderColor:'rgba(255,0,0,0.2)',
                    pointRadius:1
                });
                datasets2.unshift({
                    data: toArr(describe.q75(stats)),
                    type: "line",
                    label: "Quantile 75",
                    fill:false,
                    borderColor:'rgba(255,0,0,0.2)',
                    pointRadius:1
                });*/

                let data = {
                    labels: [],
                    datasets: datasets2
                };

                for (let j = 0; j < datasets.length; j++) {
                    data.labels.push(datasets[j].label);
                }

                old.globalShare = new Chart(document.getElementById('globalShare'), {
                    type: 'bar',
                    data: data,
                    options: {
                        plugins: {
                            title: {
                                display: false
                            },
                            responsive: false,
                            scales: {
                                x: {
                                    stacked: true,
                                },
                                y: {
                                    stacked: true
                                }
                            }
                        }
                    }
                });

            }
        })

    }

    function refreshUniverse() {
        universeSelect.innerHTML = "";
        mispaf.ajax({
            url: "universes/list",
            type: 'POST',
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
                refreshGlobal();
            }
        })
    }

    universeSelect.addEventListener('change', () => {
        localStorage.setItem("universe_id", universeSelect.value);
        refreshGlobal();
    });

    mispaf.addPageListener('enter:globalReports', refreshUniverse);

})()
