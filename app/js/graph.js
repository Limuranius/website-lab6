function getTableData() {
    return get_sorted_filtered_data()
}


function groupRows(rows, groupField) {
    let field_i = get_field_index(groupField);
    return d3.group(rows, row => row[field_i]);
}


let groupRowsProcessors = {  // Методы обработки сгруппированной группы строк данных
    "Число запусков": function(groupRows) {
        let count = groupRows.length;
        return {"Число запусков": count}
    },

    "Статус": function(groupRows) {
        let res = {};
        statField_i = get_field_index("Статус");
        groupRows.forEach((row) => {
            let status = row[statField_i];
            if (!(status in res)) {
                res[status] = 0;
            }
            res[status]++;
        })
        return res;
    }
}


function getGraphData(rows, xField, yField) {
    /*
    Возвращает данные в виде:
    {
        <Значение по x 1>: {<Легенда 1>: Число, <Легенда 2>: Число, ...},
        ...
    }
    */
    let groupedData = groupRows(rows, xField);
    let result = {};
    for (let group of groupedData) {
        let groupField = group[0];
        let groupRows = group[1];
        result[groupField] = groupRowsProcessors[yField](groupRows);
    }
    return result
}

function getDataRange(graphData) {

    console.log(graphData)
    // Находит размах данных по оси Y
    let values = [];
    for (let xField of Object.keys(graphData)) {
        for (let legendField of Object.keys(graphData[xField])) {
            values.push(graphData[xField][legendField]);
        }
    }
    let dataMin = d3.min(values);
    let dataMax = d3.max(values);
    return [dataMin, dataMax];
}

function getLegendLabels(legendObj) {
    return Object.keys(legendObj)
}

function getAllLegendLabels(graphData) {
    let result = new Set();
    for (let xField of Object.keys(graphData)) {
        result = new Set([...result, ...Object.keys(graphData[xField])]);
    }
    return [...result]
}


function onDrawGraphClicked(graph_form) {
    //let graph_form = document.forms["graph"]
    let xField = graph_form["ox"].value;
    let yField = graph_form["oy"].value;
    let rows = getTableData();
    let data = getGraphData(rows, xField, yField);
    //drawGraph(data, "Точечная");
    drawGraph(data, "Столбчатая");
}


function drawGraph(graphData, diagrammType) {
    //let colors = d3.scaleOrdinal(d3.schemeCategory10);
    let marginX = 50;
    let marginY = 50;
    let height = 400;
    let width = 1200;
    let svg = d3.select("svg")
        .attr("height", height)
        .attr("width", width);

    // очищаем svg перед построением 
    svg.selectAll("*").remove();

    // определяем минимальное и максимальное значение по оси OY 
    let yRange = getDataRange(graphData)
    let min = yRange[0] * 0.95;
    let max = yRange[1] * 1.05;
    let xAxisLen = width - 2 * marginX;
    let yAxisLen = height - 2 * marginY;

    let xLabels = Object.keys(graphData)

    // определяем шкалы для осей 
    let scaleX = d3.scaleBand()
        .domain(xLabels)
        .range([0, xAxisLen], 1)
        .padding(0.2);
    let scaleY = d3.scaleLinear()
        .domain([min, max])
        .range([yAxisLen, 0]);

    // создаем оси 
    let axisX = d3.axisBottom(scaleX); // горизонтальная 
    let axisY = d3.axisLeft(scaleY); // вертикальная 

    // отображаем ось OX, устанавливаем подписи оси ОX и угол их наклона 
    svg.append("g")
        .attr("transform", `translate(${marginX}, ${height - marginY})`)
        .call(axisX)
        .attr("class", "x-axis")
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // отображаем ось OY 
    svg.append("g")
        .attr("transform", `translate(${marginX}, ${marginY})`)
        .attr("class", "y-axis")
        .call(axisY);

    // создаем набор вертикальных линий для сетки 
    d3.selectAll("g.x-axis g.tick")
        .append("line") // добавляем линию 
        .classed("grid-line", true) // добавляем класс 
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", - (yAxisLen));

    // создаем горизонтальные линии сетки 
    d3.selectAll("g.y-axis g.tick")
        .append("line")
        .classed("grid-line", true)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", xAxisLen)
        .attr("y2", 0);

    // отображаем данные в виде точечной диаграммы 
    let colors = ["rgb(255, 0, 0)", "rgb(0, 0, 255)", "rgb(0, 255, 255)", "rgb(0, 255, 0)"];
    let legendLabels = getAllLegendLabels(graphData);
    let legendSize = legendLabels.length
    let segmentWidth = scaleX.bandwidth()
    let legendWidth = segmentWidth / legendSize
    for (let xField of xLabels) {
        if (diagrammType == "Точечная") {
            svg.selectAll(".dot")
                .data(legendLabels)
                .enter()
                .append("circle")
                .attr("r", 5)
                .attr("cx", function () { return scaleX(xField); })
                .attr("cy", function (legendField) { return scaleY(graphData[xField][legendField]); })
                .attr("transform", `translate(${marginX + scaleX.bandwidth() / 2}, ${marginY})`)
                .style("fill", "white")
        } else if (diagrammType == "Столбчатая") {
            svg.selectAll(".dot")
                .data(legendLabels)
                .enter()
                .append("rect")
                .attr("x", function (legendField, i) { return scaleX(xField) + legendWidth * i; })
                .attr("width", legendWidth)
                .attr("y", function (legendField) { return scaleY(graphData[xField][legendField]); })
                .attr("height", function (legendField) { return yAxisLen - scaleY(graphData[xField][legendField]); })
                .attr("transform", `translate(${marginX}, ${marginY})`)
                .attr("fill", (d, i) => colors[i]);
        }
    }
    
    // создаем легенду
    let legendX = width / 2;
    let legendY = marginY;

    var lineLegend = svg.selectAll(".lineLegend") 
        .data(legendLabels) 
        .enter() 
        .append("g") 
        .attr("class","lineLegend") 
        .attr("transform", function (d,i) { return `translate(${legendX}, ${legendY + i * 15})`; }); 
    
    // добавляем текстовые надписи 
    lineLegend.append("text") 
        .text(function (d) {return d;}) 
        .attr("transform", "translate(20,8)")
        .attr("fill", "white") 
        .style("font", "12px Verdana") 
    
    // добавляем прямоугольники соответствующих цветов 
    lineLegend.append("rect") 
        .attr("fill", function (d, i) {return colors[i]; }) 
        .attr("width", 15)
        .attr("height", 5);
}