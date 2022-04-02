const desiredFields = ['latitude', 'longitude', 'name', 'description', 'submission_date', 'author'];
// other fields are: id, image_name, hide_author
async function getData() {
    let response = await fetch('http://localhost:3000/features');
    if (response.ok) {
        let results = response.json();
        return results;
    } else {
        console.log(response);
    }
}
const parseCoordinates = (stringValue) => {
    let floatValue = parseFloat(stringValue);
    floatValue = floatValue.toFixed(4);
    let processedStringValue = String(floatValue);
    // This is probably unnecessary if I align items to the left. it's only useful if I center them and want all of them to have same length. 9 comes from 4 decimal spots, '.', 3 spots for the integer value and a possible '-'
    // processedStringValue = processedStringValue.padStart(9, ' '); 
    return processedStringValue;
}
async function createTable() {
    let tableDiv = document.getElementById('pollutedAreasTable');
    let data = await getData();
    if (data.results.length === 0) {
        let p = document.createElement('p');
        p.textContent = 'There are currently no polluted areas signaled or we failed to fetch them. Try again later.'
        tableDiv.append(td);
        return;
    }
    let table = document.createElement('table');
    createTableHead(table, data.results[0]);
    let tr, td;
    for (let row of data.results) {
        tr = document.createElement('tr');
        // for (let prop in row) {
        for (let prop of desiredFields) {
            td = document.createElement('td');
            switch (prop) {
                case 'author':
                    td.textContent = row.hide_author ? '/' : row[prop];
                    break;
                case 'submission_date':
                    let date = new Date(row[prop]);
                    td.textContent = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                    break;
                case 'name':
                    let a = document.createElement('a');
                    a.textContent = row[prop];
                    a.href = `http://localhost:3000/submissions/${row.id}`;
                    td.append(a);
                    break;
                case 'latitude':
                case 'longitude':
                    td.textContent = parseCoordinates(row[prop]);
                    td.classList.add('coordinates')
                    break;
                default:
                    td.textContent = row[prop];
            }
            tr.append(td);
        }
        table.append(tr);
    }
    tableDiv.append(table);
}
function createTableHead(table, row) {
    let tr = document.createElement('tr');
    let th;
    // for (let prop in row) {
    for (let prop of desiredFields) {
        th = document.createElement('th');
        th.textContent = prop;
        tr.append(th);
    }
    table.append(tr);
}
createTable();