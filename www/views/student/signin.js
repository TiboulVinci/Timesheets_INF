document.querySelector('#signin form.signin button[type="submit"]').addEventListener('click',(event)=>{
    event.preventDefault();
    mispaf.ajax({
        url: "auth/login",
        data:mispaf.parentElement(event.target,'form'),
        success:checkWhoAmI
    })
});

document.querySelector('#signin form.register button[type="submit"]').addEventListener('click',(event)=>{
    event.preventDefault();
    mispaf.ajax({
        url: "auth/register",
        data:mispaf.parentElement(event.target,'form'),
        success:checkWhoAmI
    })
});


document.querySelector('#logout').addEventListener('click',(event)=>{
    event.preventDefault();
    event.stopPropagation();
    mispaf.ajax({
        url:"auth/logout",
        success:checkWhoAmI
    })
});

document.querySelector('#password').addEventListener('click',(event)=>{
    event.preventDefault();
    event.stopPropagation();
    let diag = document.createElement('DIV');
    diag.setAttribute("class", "modal");
    diag.setAttribute("tabindex", "-1");
    diag.innerHTML = `
<div class="modal-dialog">
<div class="modal-content">
<div class="modal-body">
<form>
<div class="form-floating">
    <input type="password" class="form-control" id="floatingPassword" placeholder="Password"
        autocomplete="new-password" name="password" readonly onfocus="if (this.hasAttribute('readonly')) {
            this.removeAttribute('readonly');
            // fix for mobile safari to show virtual keyboard
            this.blur();    this.focus();  }">
    <label for="floatingPassword">Current Password</label>
</div>
<div class="form-floating">
    <input type="password" class="form-control" id="floatingPassword1" placeholder="Password"
        autocomplete="new-password" name="password1" readonly onfocus="if (this.hasAttribute('readonly')) {
            this.removeAttribute('readonly');
            // fix for mobile safari to show virtual keyboard
            this.blur();    this.focus();  }">
    <label for="floatingPassword1">New Password</label>
</div>
<div class="form-floating">
    <input type="password" class="form-control" id="floatingPassword2" placeholder="Repeat Password"
        autocomplete="new-password" name="password2" readonly onfocus="if (this.hasAttribute('readonly')) {
            this.removeAttribute('readonly');
            // fix for mobile safari to show virtual keyboard
            this.blur();    this.focus();  }">
    <label for="floatingPassword2">Repeat New Password</label>
</div>
</form>
</div>
<div class="modal-footer">
    <button type="button" class="btn btn-secondary">Cancel</button>
    <button type="button" class="btn btn-primary">Confirm</button>
</div>
</div>
</div>
`;
    let modal = smartmodal(diag);
    modal.title("Change Password");
    modal.button(0, () => {
        modal.close();
    });
    modal.button(1, () => {
        mispaf.ajax({
            url: "auth/changePassword",
            data:modal.el.querySelector("form"),
            success() {
                modal.close();
            }
        })
    });
    modal.show();
});

(()=>{
    let select=document.getElementById('universe');
    select.addEventListener("change",()=>{
        let tmp=select.value;
        tmp=select.querySelector(`option[value="${tmp}"]`);
        if (tmp!=null) {
            document.getElementById("groupName").innerHTML=mispaf.escape(" - "+tmp.getAttribute('data-group'));
        }
    });
})();
