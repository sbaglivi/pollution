let deleteAccountForm = document.getElementById('deleteAccountForm');

deleteAccountForm.addEventListener('submit', e => {
    e.preventDefault();
    let sure = confirm(`Are you sure you want to delete all of your account data? You won't be able to recover it`);
    if (sure) {
        console.log('user really wants to do it')
    }
})