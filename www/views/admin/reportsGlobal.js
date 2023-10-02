(() => {

    let universeSelect = document.querySelector('#globalReports select[name="universe"]');
    let universes = {};



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
                let groupname ={};
                for (let i = 0; i < response.data.length; i++) {
                    let e = response.data[i];
                    if (!(e.group_id in pergroup)) {
                        pergroup[e.group_id] = {};
                        groupname[e.group_id] = e.name;
                    }
                    pergroup[e.group_id][e.slice_id] = e.length;
                }
                let datasets = [];
                let idx = 0;
                for (let u in pergroup) {
                    let data = [];
                    for (let k in response.slices) {
                        data.push(pergroup[u][k] || 0);
                    }
                    let color = getPaletteColor(idx);
                    idx++;
                    datasets.push({
                        data,
                        label: groupname[u],
                        lineTension: 0,
                        backgroundColor: 'transparent',
                        borderColor: color,
                        borderWidth: 4,
                        pointBackgroundColor: color
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

                let data = [];
                for (let u in pergroup) {
                    let total = 0;
                    for (let k in response.slices) {
                        total += pergroup[u][k] || 0;
                    }
                    data.push(total);
                }
                labels=[];
                for(let u in pergroup) labels.push(groupname[u]);

                old.globalShare = new Chart(document.getElementById('globalShare'), {
                    type: 'pie',
                    data: {
                        labels: labels,
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

    function refreshUniverse() {
        universeSelect.innerHTML="";
        mispaf.ajax({
            url: "universes/list",
            type: 'POST',
            success(response) {
                let cur=parseInt(localStorage.getItem("universe_id"));
                universeSelect.innerHTML="";
                universes = {};
                for (let i = 0; i < response.length; i++) {
                    universes[response[i].universe_id]=response[i];
                    let option = document.createElement("OPTION");
                    let state=[];
                    if (response[i].active==0) state.push("Inactive");
                    if (response[i].registrable==0) state.push("Registration closed");
                    if (state.length>0) {
                        state=" ("+state.join(", ")+")";
                    } else {
                        state="";
                    }
                    option.innerHTML = mispaf.escape(response[i].name+state);
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

    universeSelect.addEventListener('change', ()=>{
        localStorage.setItem("universe_id", universeSelect.value);
        refreshGlobal();
    });

    mispaf.addPageListener('enter:globalReports', refreshUniverse);

})()
