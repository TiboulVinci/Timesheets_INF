(() => {

    feather.replace({ 'aria-hidden': 'true' })

    let old = {};
    function getUniverse() {
        return parseInt(document.getElementById("universe").value);
    }

    function refresh() {
        if ("mytime" in old) {
            old.mytime.destroy();
            delete old.mytime;
        }

        if ("globaltime" in old) {
            old.globaltime.destroy();
            delete old.globaltime;
        }

        if ("localtime" in old) {
            old.localtime.destroy();
            delete old.localtime;
        }

        mispaf.ajax({
            url: "reports/mytimes",
            data: { universe_id: getUniverse() },
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

                old.mytime = new Chart(document.getElementById('mytime'), {
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

                old.globaltime = new Chart(document.getElementById('globaltime'), {
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

                // find a slice 

                let cand = null;
                for (let k in response.slices) {
                    let slice=response.slices[k];
                    if (slice.end_date == 0) {
                        if (cand == null || cand.start_date < slice.start_date || (cand.start_date == slice.start_date && cand.slice_id < slice.slice_id)) cand = slice;
                    }
                }
                if (cand == null) {
                    document.getElementById('thisslicetitle').style.display='none';
                    document.getElementById('localtime').style.display='none';
                } else {
                    document.getElementById('thisslicetitle').style.display='block';
                    document.getElementById('localtime').style.display='block';
                    document.querySelector('#thisslicetitle span').innerHTML=cand.name;
                    

                    let data = [];
                    for (let u in peruser) {
                        let total = peruser[u][cand.slice_id] || 0;
                        data.push(total);
                    }
    
                    old.localtime = new Chart(document.getElementById('localtime'), {
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
                                    display: false                                }
                            }
                        }
                    })

                }
            }
        })
    }

    mispaf.addPageListener('enter:reports', refresh);
    document.getElementById('universe').addEventListener('change', () => {
        if (mispaf.page()=="reports") refresh();
    });

})()
