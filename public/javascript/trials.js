var data = {};
data.trials = [];
var trialNumber = 0;
var dataset;
var width = 900,
    height = 360;

createGo();

//Load JSON file
function load() {
  d3.json("data/stream_test.json", function(error, data) {
    if (error) {
      console.log(error);
    } else {
      console.log(data);
    }
    data = data[trialNumber];
    dataset = data;
    //load in cursor value as well

    //Adds current time to time offset to simulate a realtime dataset
    var now = +new Date() + 1000;
    data.forEach(function (d) {
      d.timeoffset = (now) + d.timeoffset * 1000;
      d.timeoffset = +d.timeoffset;
      d.value = +d.value;
      d.primary = d.primary;
      d.secondary = d3.secondary;
    });

    createChart();
    createCursor();
  });
}

//Create chart
function createChart() {
  var chart = StreamScatterPlot()
      .x(function(d) { return +d.timeoffset; })
      .y(function(d) { return +d.value; })
      .flag(function(d) { return d.flag; })
      .id(function(d) { return d.id; })
      .width(width)
      .height(height)
      .allowZoom(false)
      .allowPause(false);
  var stream = d3.select("#trialsChart")
    .datum(dataset)
    .call(chart);

  //Start streaming
  chart.start();
}

//Create Cursor
function createCursor() {
  var svg = d3.select("svg").data(StreamScatterPlot.getData());
  NormalCursor(svg);
  //Update current selectors
  d3.timer(function() {
  	//Redraw cursor selector
  	NormalCursor.redraw();
  });
}

function createGo() {
  var svg = d3.select("#trialsChart").append("svg")
    .attr("width", width)
    .attr("height", height);

  var g = svg.append("g").attr("class", "go");
  g.append("circle")
    .attr("cx", width/2)
    .attr("cy", height/2)
    .attr("r", 50)
    .style("fill", "green");
  g.append("text")
    .attr("x", width/2 - 40)
    .attr("y", height/2 + 20)
    .style("font-family", "sans-serif")
    .style("font-size", "50px")
    .style("fill", "white")
    .style("cursor", "default")
    .text("GO");
  g.on("click.go", function() { d3.select("svg").remove(); load(); });
}

function addTrialData(err, time) {
  data.trials[trialNumber] = { "id": trialNumber, "errors": err, "time": time };
  trialNumber += 1;
}

function getTrialData() {
  return data;
}
