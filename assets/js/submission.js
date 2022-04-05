let editButton = document.getElementsByClassName('editButton')[0];
if (editButton) {
    let titleElement = document.getElementsByClassName('title')[0];
    let descriptionElement = document.getElementsByClassName('description')[0];
    let latitudeElement = document.getElementsByClassName('latitude')[0];
    let longitudeElement = document.getElementsByClassName('longitude')[0];
    let HTMLElements = [titleElement, descriptionElement, latitudeElement, longitudeElement];
    let titleInput = document.createElement('input');
    titleInput.type = 'text';
    let descriptionInput = document.createElement('textarea');
    let latitudeInput = document.createElement('input');
    latitudeInput.type = 'number';
    let longitudeInput = document.createElement('input');
    longitudeInput.type = 'number';
    let HTMLInputs = [titleInput, descriptionInput, latitudeInput, longitudeInput];
    let currentlyEditing = false;
    let confirmButton = null;
    let modal = document.getElementsByClassName('modal')[0];
    let editsDiv = document.getElementsByClassName('edits')[0];
    editButton.addEventListener('click', e => {
        if (!currentlyEditing) {
            currentlyEditing = true;
            startEditing();
        } else {
            currentlyEditing = false;
            stopEditing();
        }
    })
    function stopEditing() {
        editButton.textContent = 'Edit'
        titleInput.replaceWith(titleElement);
        descriptionInput.replaceWith(descriptionElement);
        latitudeInput.replaceWith(latitudeElement);
        longitudeInput.replaceWith(longitudeElement);
        document.body.remove(confirmButton);
    }
    function startEditing() {
        editButton.textContent = 'Stop editing';
        let title = titleElement.textContent;
        let description = descriptionElement.textContent;
        let latitude = latitudeElement.textContent;
        let longitude = longitudeElement.textContent;
        titleInput.value = title;
        titleElement.replaceWith(titleInput);
        descriptionInput.value = description;
        descriptionElement.replaceWith(descriptionInput);
        latitudeInput.value = parseFloat(latitude);
        latitudeElement.replaceWith(latitudeInput);
        longitudeInput.value = parseFloat(longitude);
        longitudeElement.replaceWith(longitudeInput);
        if (confirmButton === null) {
            confirmButton = document.createElement('button');
            confirmButton.textContent = 'Save edits';
            confirmButton.addEventListener('click', e => {
                if (!currentlyEditing) {
                    return;
                }
                editsDiv.innerHTML = '';
                let elementsName = ['title', 'description', 'latitude', 'longitude'];
                let someChanges = false;
                for (let i = 0; i < HTMLElements.length; i++) {
                    if (HTMLElements[i].textContent !== HTMLInputs[i].value) {
                        somechanges = true;
                        let pre = document.createElement('pre');
                        pre.textContent = `Changes to ${elementsName[i]}: \n|${HTMLElements[i].textContent}| => |${HTMLInputs[i].value}|\ntypes: ${typeof HTMLElements[i].textContent} - ${typeof HTMLInputs[i].value} `;
                        editsDiv.append(pre);
                    }
                }
                if (!someChanges) {
                    editsDiv.append(document.createElement('p').textContent = 'Lol no changes');
                }
                modal.style.display = 'block';
            })
        }
        document.body.append(confirmButton);


        // submission date - no, maybe i can add an update field later on but it wouldnt make sense to change the submission date.?
        // hide author ?
        // image swap?
        // coordinates
    }
}
