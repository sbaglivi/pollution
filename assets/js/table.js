// other fields are: id, image_name, hide_author
class TableUI {
    constructor() {
        this.desiredFields = ['latitude', 'longitude', 'name', 'description', 'submission_date', 'author'];
        this.sortingOrder = { by: null, asc: null };
        this.data = null;
        this.tableDiv = document.getElementById('pollutedAreasTable');
        this.table = document.createElement('table');
        this.tableDiv.append(this.table);
        this.tbody = document.createElement('tbody');
        this.theaders = [];
        this.createTable();
    }
    async createTable() {
        this.table.append(this.createTableHead());
        this.data = await this.getData();
        if (this.data.length === 0) {
            let p = document.createElement('p');
            p.textContent = 'There are currently no polluted areas signaled or we failed to fetch them. Try again later.'
            this.tableDiv.append(td);
            return;
        }
        this.table.append(this.tbody);
        this.renderRows();
    }
    renderRows() {
        this.tbody.innerHTML = '';
        this.tbody.append(...this.createTableRows());
    }
    async getData() {

        let response = await fetch('api/getAllSubmissions');
        if (response.ok) {
            let results = response.json();
            return results;
        } else {
            console.log(response);
        }
    }
    sortAndRender(clicked) {
        this.updateSortingOrder(clicked);
        this.sortDataByOrder();
        this.renderRows();
    }
    createTableHead() {
        let tr = document.createElement('tr');
        let th;
        // for (let prop in row) {
        for (let prop of this.desiredFields) {
            th = document.createElement('th');
            th.textContent = prop;
            th.addEventListener('click', this.sortAndRender.bind(this, th.textContent));
            tr.append(th);
            this.theaders.push(th);
        }
        return tr;
    }
    createTableRows() {
        let tr, td, rows = [];
        for (let row of this.data) {
            tr = document.createElement('tr');
            // for (let prop in row) {
            for (let prop of this.desiredFields) {
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
                        a.href = `submission/${row.id}`;
                        td.append(a);
                        break;
                    case 'latitude':
                    case 'longitude':
                        td.textContent = this.parseCoordinates(row[prop]);
                        td.classList.add('coordinates')
                        break;
                    case 'description':
                        td.textContent = row[prop].substring(0, 50) + '...';
                        break;
                    default:
                        td.textContent = row[prop];
                }
                tr.append(td);
            }
            rows.push(tr);
            // table.append(tr);
        }
        return rows;
    }
    parseCoordinates = (stringValue) => {
        let floatValue = parseFloat(stringValue);
        floatValue = floatValue.toFixed(4);
        let processedStringValue = String(floatValue);
        // This is probably unnecessary if I align items to the left. it's only useful if I center them and want all of them to have same length. 9 comes from 4 decimal spots, '.', 3 spots for the integer value and a possible '-'
        // processedStringValue = processedStringValue.padStart(9, ' '); 
        return processedStringValue;
    }
    updateSortingOrder(clicked) {
        console.log(`${clicked} was clicked, order was ${this.sortingOrder.asc}, ${this.sortingOrder.by}`);
        if (this.sortingOrder.by !== null) {
            this.sortingOrder.asc === 1 ? this.theaders[this.desiredFields.indexOf(this.sortingOrder.by)].classList.remove('asc') : this.theaders[this.desiredFields.indexOf(this.sortingOrder.by)].classList.remove('des');
        }
        this.sortingOrder.asc = this.sortingOrder.by === clicked ? -1 * this.sortingOrder.asc : 1;
        this.sortingOrder.by = clicked;
        console.log(`new order is ${this.sortingOrder.asc}, ${this.sortingOrder.by}`);
        console.log(this.theaders[this.desiredFields.indexOf(clicked)])
        this.sortingOrder.asc === 1 ? this.theaders[this.desiredFields.indexOf(clicked)].classList.add('asc') : this.theaders[this.desiredFields.indexOf(clicked)].classList.add('des');
    }
    sortDataByOrder() {
        this.data.sort((a, b) => this.sortingOrder.asc * (a[this.sortingOrder.by] < b[this.sortingOrder.by] ? -1 : 1));
    }
}
let table = new TableUI();