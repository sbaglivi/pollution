import TableUI from "./TableClass.js";
let table = new TableUI('tableDiv', ['latitude', 'longitude', 'name', 'description', 'id', 'submission_date'], true)
let deleteSpans = document.getElementsByClassName('deleteSpan');
Array.from(deleteSpans).forEach(deleteSpan => {
    deleteSpan.addEventListener('click', async e => {
        // let confirmText = `Are you sure you want to delete the submission with title: "${deleteSpan.parentElement.textContent.match(/^(?:\s)*([\w\d][\s\S]+) - ✖\s*$/)[1]}"?`
        let titleSpan = deleteSpan.previousElementSibling;
        let confirmText = `Are you sure you want to delete the submission with title: "${titleSpan.textContent}"?`
        if (confirm(confirmText)) {
            console.log("Wow, he's really going to do it");
            let id = titleSpan.previousElementSibling.textContent;
            let result = await fetch(`api/deleteSubmission/${id}`, {
                method: 'DELETE',
            });
            if (result.ok) {
                let processedResult = await result;
                console.log(processedResult)
                titleSpan.parentElement.remove();
            } else {
                console.log(`result not ok`);
                console.log(result);
            }

        }
    })
})