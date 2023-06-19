function listUsersInGroup(memel, getUniverse,getGroup) {
    let uid=getUniverse();
    let gid=getGroup();
    mispaf.ajax({
        url: "groups/listUsersInGroup",
        data: { universe_id: uid, group_id: gid },
        success(response) {
            if (uid == getUniverse() && gid == getGroup()) {
                for (let i = 0; i < response.length; i++) {
                    let span = document.createElement('SPAN');
                    let a=document.createElement('a');
                    a.setAttribute("onclick",`showUser("${response[i].login}")`);
                    a.innerText = response[i].login;
                    a.setAttribute('href','#')
                    span.appendChild(a);
                    memel.appendChild(span);
                }
            }
        }
    })
}

function showUser(login) {
    event.preventDefault();
    mispaf.page('spy');
    document.querySelector('#spy [name="filter"]').value=login;
}

(()=>{
    let clears=document.querySelectorAll('.clear');
    for(let i=0; i<clears.length; i++) {
        clears[i].addEventListener('click',(event)=>{
            event.preventDefault();
            let tgt=event.target.getAttribute('data-for');
            document.getElementById(tgt).value='';
            document.getElementById(tgt).dispatchEvent(new Event('change'));
            document.getElementById(tgt).dispatchEvent(new Event('keyup'));
        });
    }

    function bindTab(root) {
        let tabs=root.querySelectorAll("button.nav-link");
        function hideAll() {
            for(let i=0; i<tabs.length; i++) {
                document.querySelector(tabs[i].getAttribute("data-bs-target")).style.display="none";
            }
        }
        function select(tab) {
            hideAll();
            tab.classList.remove("active");
            tab.classList.add("active");
            document.querySelector(tab.getAttribute("data-bs-target")).style.display="initial";
            tab.dispatchEvent(new Event("focus"));
        }
        hideAll();
        for(let i=0; i<tabs.length; i++) {
            tabs[i].addEventListener("click",(event)=>{
                select(tabs[i]);
            });
            if (tabs[i].classList.contains("active")) {
                select(tabs[i]);
            }
        }
    }

    let tabs=document.getElementsByClassName("nav-tabs");
    for(let i=0; i<tabs.length; i++) bindTab(tabs[i]);

})();