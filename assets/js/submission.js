let editButton = document.getElementsByClassName('editButton')[0];
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
function swapElements(currentElements, newElements) {
    if (currentElements.length !== newElements.length) throw Error("Length mismatch between elements to be swapped")
    for (let i = 0; i < currentElements.length; i++) {
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
    let changes = {};
    let nameToElement = { name: titleElement, description: descriptionElement, latitude: latitudeElement, longitude: longitudeElement };
    confirmButton.addEventListener('click', async e => {
        let requestBody = {};
        for (let input in changes) {
            requestBody[input] = changes[input]['newValue'];
        }
        // console.log(changes);
        // console.log(requestBody);
        let response = await fetch(`/updateSubmission/${submissionId}`, {
            method: 'PUT',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(requestBody)
        })
        if (response.ok) {
            let result = await response.json();
            console.log(result);
            for (let key in requestBody) {
                nameToElement[key].textContent = requestBody[key];
            }
            stopEditing();
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
        // return changes;
    }
    function showModal(editsDiv, modal, HTMLElements, HTMLInputs, confirmButton) {
        // let [content, changed] = createEditsParagraph(HTMLElements, HTMLInputs);
        // let changes = findChanges(HTMLElements, HTMLInputs);
        findChanges(HTMLElements, HTMLInputs);
        console.log(changes)
        editsDiv.innerHTML = '';
        if (Object.keys(changes).length === 0) {
            confirmButton.setAttribute('hidden', 'true');
            let p = document.createElement('p');
            p.textContent = 'You have made no changes';
            editsDiv.append(p);
        } else {
            confirmButton.removeAttribute('hidden');
            content = createEditsParagraph();
            editsDiv.append(content);
        }
        modal.style.display = 'block';
    }
    function createEditsParagraph() {
        let pre = document.createElement('pre');
        let textContent = '';
        // let inputValues = ['previousValue', 'newValue'];
        for (let input in changes) {
            textContent += `Changes to ${input}:\n'${changes[input]['previousValue']}' => '${changes[input]['newValue']}'\n`;
        }
        pre.textContent = textContent;
        return pre;
    }
    function stopEditing() {
        editButton.textContent = 'Edit'
        swapElements(HTMLInputs, HTMLElements);
        initializeInputElements(HTMLInputs, HTMLElements);
        applyButton.setAttribute('hidden', 'true');
    }
    function startEditing() {
        editButton.textContent = 'Stop editing';
        initializeInputElements(HTMLInputs, HTMLElements);
        swapElements(HTMLElements, HTMLInputs);
        applyButton.removeAttribute('hidden');

        // submission date - no, maybe i can add an update field later on but it wouldnt make sense to change the submission date.?
        // hide author ?
        // image swap?
        // coordinates
    }
}
