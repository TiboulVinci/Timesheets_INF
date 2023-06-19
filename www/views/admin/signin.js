document.querySelector('#signin button[type="submit"]').addEventListener('click', (event) => {
    event.preventDefault();
    mispaf.ajax({
        url: "auth/login",
        data: mispaf.parentElement(event.target, 'form'),
        success:checkWhoAmI
    })
});

document.querySelector('#logout').addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    mispaf.ajax({
        url: "auth/logout",
        success:checkWhoAmI
    })
});