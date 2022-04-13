let editButton = document.getElementsByClassName('editButton')[0];
let fileInputLabel = document.getElementsByClassName('fileInputLabel')[0];
let fileInput = document.getElementsByClassName('fileInput')[0];
let updatedFileName = document.getElementsByClassName('updatedFileName')[0];
let updatedFileDiv = document.getElementsByClassName('updatedFileDiv')[0];
let imageUndoButton = document.getElementsByClassName('imageUndoButton')[0];
fileInputLabel.addEventListener('click', e => {
    fileInput.click();
})
function createInputElements() {
    let titleInput = document.createElement('input');
    titleInput.type = 'text';
    let descriptionInput = document.createElement('textarea');
    let latitudeInput = document.createElement('input');
    latitudeInput.type = 'number';
    let longitudeInput = document.createElement('input');
    longitudeInput.type = 'number';
    let HTMLInputs = [titleInput, descriptionInput, latitudeInput, longitudeInput];
    return HTMLInputs;
}
function initializeInputElements(inputElements, originalElements) {
    if (inputElements.length !== originalElements.length) throw Error('# of values for input element initialization !== # of elements');
    for (let i = 0; i < inputElements.length; i++) {
        inputElements[i].value = originalElements[i].textContent;
    }
}
function swapElements(currentElements, newElements, resetSizeValues = false) {
    if (currentElements.length !== newElements.length) throw Error("Length mismatch between elements to be swapped")
    for (let i = 0; i < currentElements.length; i++) {
        console.log(`element width: ${currentElements[i].offsetWidth}, height: ${currentElements[i].offsetHeight}`);
        if (!resetSizeValues) {
            let boundingRect = currentElements[i].getBoundingClientRect();
            newElements[i].style.width = boundingRect.width + 'px';
            newElements[i].style.height = boundingRect.height + 'px';
        } else {
            newElements[i].style.removeProperty('width');
            newElements[i].style.removeProperty('height');
        }
        currentElements[i].replaceWith(newElements[i]);
    }
    // Do i need to swap current and new arrays?
}
if (editButton) {
    let titleElement = document.getElementsByClassName('title')[0];
    let descriptionElement = document.getElementsByClassName('description')[0];
    let latitudeElement = document.getElementsByClassName('latitude')[0];
    let longitudeElement = document.getElementsByClassName('longitude')[0];
    let HTMLElements = [titleElement, descriptionElement, latitudeElement, longitudeElement];
    let HTMLInputs = createInputElements();
    let currentlyEditing = false;
    let applyButton = document.getElementsByClassName('applyButton')[0];
    let modal = document.getElementsByClassName('modal')[0];
    let editsDiv = document.getElementsByClassName('edits')[0];
    let confirmButton = document.getElementsByClassName('confirmButton')[0];
    let reviewButton = document.getElementsByClassName('reviewButton')[0];
    let submissionId = document.getElementsByClassName('submissionId')[0].textContent;
    let submissionImage = document.getElementsByClassName('submissionImage')[0];
    let changes = {};
    let nameToElement = { name: titleElement, description: descriptionElement, latitude: latitudeElement, longitude: longitudeElement };
    fileInput.addEventListener('change', e => {
        updatedFileDiv.style.display = 'block';
        updatedFileName.textContent = `New image:\n${fileInput.files[0].name}`;
    })
    function resetFileInput() {
        fileInput.value = '';
        updatedFileDiv.style.display = 'none';
    }
    imageUndoButton.addEventListener('click', e => {
        resetFileInput();
    })
    fileInput.value = '';
    confirmButton.addEventListener('click', async e => {
        let requestBody = {};
        let data = new FormData();
        for (let input in changes) {
            requestBody[input] = changes[input]['newValue'];
            data.append(input, changes[input]['newValue']);
        }
        if (fileInput.files.length === 1) {
            data.append('picture', fileInput.files[0])
        }
        // console.log(changes);
        console.log('request body is:')
        console.log(requestBody);
        console.log('formdata is:')
        for (var pair of data.entries()) {
            console.log(pair[0] + ', ' + pair[1]);
        }
        let response = await fetch(`/api/updateSubmission/${submissionId}`, {
            method: 'PUT',
            // headers: { 'Content-type': 'application/json' },
            // body: JSON.stringify(requestBody)
            // headers: {'Content-type':'multipart/form-data'},
            body: data
        })
        if (response.ok) {
            let result = await response.text();
            console.log(result);
            for (let key in requestBody) {
                nameToElement[key].textContent = requestBody[key];
            }
            if (fileInput.files.length === 1) {
                submissionImage.src = URL.createObjectURL(fileInput.files[0])
                // TODO for some reason when I change the url it seems that the image loses its original size. Will have to check better and maybe set boundaries again through style.

            }
            currentlyEditing = false;
            // I need to reset the element width here somehow. Make the browser calculate the new correct values that I'll use until new edits
            stopEditing(true);
        }
        modal.style.display = 'none';
    })
    reviewButton.addEventListener('click', e => {
        modal.style.display = 'none';
    })
    editButton.addEventListener('click', e => {
        if (!currentlyEditing) {
            currentlyEditing = true;
            startEditing();
        } else {
            currentlyEditing = false;
            stopEditing();
        }
    })
    applyButton.addEventListener('click', () => {
        showModal(editsDiv, modal, HTMLElements, HTMLInputs, confirmButton)
    });
    function findChanges(HTMLElements, HTMLInputs) {
        let elementsName = ['name', 'description', 'latitude', 'longitude'];
        changes = {};
        for (let i = 0; i < HTMLElements.length; i++) {
            if (HTMLElements[i].textContent !== HTMLInputs[i].value) {
                changes[elementsName[i]] = {};
                changes[elementsName[i]]['previousValue'] = HTMLElements[i].textContent;
                changes[elementsName[i]]['newValue'] = HTMLInputs[i].value;
            }
        }
        console.log(`file input files length: ${fileInput.files.length}`);
        // return changes;
    }
    function showModal(editsDiv, modal, HTMLElements, HTMLInputs, confirmButton) {
        // let [content, changed] = createEditsParagraph(HTMLElements, HTMLInputs);
        // let changes = findChanges(HTMLElements, HTMLInputs);
        findChanges(HTMLElements, HTMLInputs);
        console.log(changes)
        editsDiv.innerHTML = '';
        if (Object.keys(changes).length === 0 && fileInput.files.length === 0) {
            confirmButton.setAttribute('hidden', 'true');
            let p = document.createElement('p');
            p.textContent = 'You have made no changes';
            editsDiv.append(p);
        } else {
            confirmButton.removeAttribute('hidden');
            content = createEditsParagraph();
            editsDiv.append(...content);
        }
        modal.style.display = 'flex';
    }
    function createEditsParagraph() {
        let editParagraphs = [];
        let pre;
        for (let input in changes) {
            pre = document.createElement('pre');
            pre.textContent = `Changes to ${input}:\n'${changes[input]['previousValue']}' => '${changes[input]['newValue']}'\n`;
            editParagraphs.push(pre);
        }
        if (fileInput.files.length === 1) {
            pre = document.createElement('pre');
            pre.textContent = `Changing image to: ${fileInput.files[0].name}`;
            editParagraphs.push(pre);
        }
        return editParagraphs;
    }
    function stopEditing(resetSizeValues = false) {
        editButton.textContent = 'Edit'
        swapElements(HTMLInputs, HTMLElements, resetSizeValues);
        initializeInputElements(HTMLInputs, HTMLElements);
        fileInputLabel.style.display = 'none';
        resetFileInput();
        applyButton.setAttribute('hidden', 'true');
    }
    function startEditing() {
        editButton.textContent = 'Stop editing';
        initializeInputElements(HTMLInputs, HTMLElements);
        swapElements(HTMLElements, HTMLInputs);
        fileInputLabel.style.display = 'inline-block';
        applyButton.removeAttribute('hidden');

        // submission date - no, maybe i can add an update field later on but it wouldnt make sense to change the submission date.?
        // hide author ?
        // image swap?
        // coordinates
    }
}
