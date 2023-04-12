const headers = ["Год", "Название", "Ракета-носитель", "Страна", "Статус", "Цель", "Масса, кг."];

let filter_data = {
    year: {
        from: "",
        to: ""
    },
    name: "",
    carrier: "",
    country: "",
    status: "Any",
    target: "",
    mass: ""
}

let sort_data = [
    {
        field_index: -1,
        descend: false
    }, 
    {
        field_index: -1,
        descend: false
    }, 
    {
        field_index: -1,
        descend: false
    }, 
]

let header_types = {
    "Год": "Число",
    "Название": "Строка",
    "Ракета-носитель": "Строка",
    "Страна": "Строка",
    "Статус": "Строка",
    "Цель": "Строка",
    "Масса, кг.": "Число"
}


function compare_str(s1, s2, reverse) {
    if (reverse) {
        if (s1 > s2)
            return -1;
        if (s1 < s2)
            return 1;
        return 0;
    } else {
        if (s1 < s2)
            return -1;
        if (s1 > s2)
            return 1;
        return 0;
    }
}

function compare_num(n1, n2, reverse) {
    if (isNaN(n1)) {
        n1 = Infinity;
    }
    if (isNaN(n2)) {
        n2 = Infinity;
    }
    if (reverse) {
        return n2 - n1
    } else {
        return n1 - n2
    }
}


function get_compare_function() {
    let functions_list = [
        (data1, data2) => 0, 
        (data1, data2) => 0, 
        (data1, data2) => 0
    ];
    
    sort_data.forEach((el, i) => {
        if (el.field_index !== -1) {
            let field = headers[el.field_index];
            if (header_types[field] == "Число") {
                functions_list[i] = (data1, data2) => compare_num(data1, data2, el.descend);
            } else if (header_types[field] == "Строка") {
                functions_list[i] = (data1, data2) => compare_str(data1, data2, el.descend);
            }
        }
    })
    
    return (row1, row2) => {
        let head_i1 = sort_data[0].field_index;
        let head_i2 = sort_data[1].field_index;
        let head_i3 = sort_data[2].field_index;
        return functions_list[0](row1[head_i1], row2[head_i1]) || functions_list[1](row1[head_i2], row2[head_i2]) || functions_list[2](row1[head_i3], row2[head_i3]);
    }
}


async function get_json() {
    const response = await fetch('js/table_data.json')
    const json = await response.json()
    return json
}


async function fill_table() {
    let data = await get_json();
    data = apply_filtering(data);
    data.sort(get_compare_function());

    let table = document.getElementById("satellite-table");
    data.forEach((data_row) => {
        let row = table.insertRow();
        data_row.forEach((data_cell) => {
            row.insertCell().innerHTML = data_cell;
        });
    });
}

function clear_table() {
    let table = document.getElementById("satellite-table");
    while (table.rows.length > 1) {
        console.log(table.rows.length);
        table.deleteRow(1);
    }
}


function on_filter_change() {
    let f = document.forms["filter"];
    filter_data.year.from = f["yFrom"].value;
    filter_data.year.to = f["yTo"].value;
    filter_data.name = f["name"].value;
    filter_data.carrier = f["carrier"].value;
    filter_data.country = f["country"].value;
    filter_data.status = f["status"].value;
    filter_data.target = f["target"].value;
    filter_data.mass = f["mass"].value;

    clear_table();
    fill_table();
}

function on_sort_change() {
    let f = document.forms["sort"];
    sort_data[0].field_index = +f["sortFirst"].value;
    sort_data[0].descend = f["descFirst"].checked;
    sort_data[1].field_index = +f["sortSecond"].value;
    sort_data[1].descend = f["descSecond"].checked;
    sort_data[2].field_index = +f["sortThird"].value;
    sort_data[2].descend = f["descThird"].checked;

    clear_table();
    fill_table();
}


function set_filter_listeners() {
    let f = document.forms["filter"];
    for (let i in f.elements) {
        let el = f.elements[i];
        el.onchange = on_filter_change
    };
}

function set_sort_listeners() {
    let f = document.forms["sort"];
    for (let i in f.elements) {
        let el = f.elements[i];
        el.onchange = on_sort_change
    };
}


function apply_filtering(rows) {
    let res = [];
    for (let i in rows) {
        let el = rows[i];

        let year_start = +filter_data.year.from
        let year_end = filter_data.year.to ? +filter_data.year.to : Infinity;
        let year_ok =  el[0] >= year_start && el[0] <= year_end;
        let name_ok = (!Boolean(filter_data.name)) || el[1].includes(filter_data.name);
        let carrier_ok = (!Boolean(filter_data.carrier)) || el[2].includes(filter_data.carrier);
        let country_ok = (!Boolean(filter_data.country)) || el[3].includes(filter_data.country);
        let status_ok = filter_data.status === "Any" || el[4] === filter_data.status;
        let target_ok = (!Boolean(filter_data.target)) || el[5].includes(filter_data.target);
        let mass_ok = (!Boolean(filter_data.mass)) || el[6] <= +filter_data.mass;
        
        let is_ok = year_ok && name_ok && carrier_ok && country_ok && status_ok && target_ok && mass_ok;
        if (is_ok) {
            res.push(el);
        }
    };
    return res;
}


document.addEventListener("DOMContentLoaded", () => {
    fill_table();
    set_filter_listeners();
    set_sort_listeners();
});

