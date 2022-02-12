async function getData(){
    let response = await fetch('http://localhost:3000/features');
    if (response.ok){
        let results = response.json();
        return results;
    } else {
        console.log(response);
    }
}
async function createTable(){
    let tableDiv = document.getElementById('pollutedAreasTable');
    let data = await getData();
    if (data.results.length === 0){
        let p = document.createElement('p');
        p.textContent = 'There are currently no polluted areas signaled or we failed to fetch them. Try again later.'
        tableDiv.append(td);
        return;
    }
    let table = document.createElement('table');
    createTableHead(table, data.results[0]);
    let tr, td;
    for (let row of data.results){
        tr = document.createElement('tr');
        for (let prop in row){
            td = document.createElement('td');
            td.textContent = row[prop];
            tr.append(td);
        }
        table.append(tr);
    }
    tableDiv.append(table);
}
function createTableHead(table, row){
    let tr = document.createElement('tr');
    let th;
    for (let prop in row){
        th = document.createElement('th');
        th.textContent = prop;
        tr.append(th);
    }
    table.append(tr);
}
createTable();