var data = {};
data.trials = [];
var trialNumber = 0;
var dataset;
var width = 900,
    height = 360;

// createGo();
createQuestion();
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
    .attr("border", 1)
    .attr("width", width)
    .attr("height", height);

  var g = svg.append("g").attr("class", "go");
  var goCircle = g.append("circle")
    .attr("cx", width/2)
    .attr("cy", height/2)
    .attr("r", 0)
    .style("fill", "#4CAF50");
  var goText = g.append("text")
    .attr("x", width/2 - 40)
    .attr("y", height/2 + 20)
    .style("font-family", "sans-serif")
    .style("font-size", "0px")
    .style("fill", "#F4F4F4")
    .style("cursor", "default")
    .text("GO");

  goCircle.transition().duration(500).attr("r", 50);
  goText.transition().duration(500).style("font-size", "50px");
  g.on("click.go", function() { d3.select("svg").remove(); load(); });
}

function createQuestion() {
  var svg = d3.select("#trialsChart").append("svg")
    .attr("border", "1px solid black")
    .attr("width", width)
    .attr("height", height);

  var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  var rows = 3;
  var cols = 3;
  var g = svg.append("g").attr("class", "question");
  var numpad = g.selectAll("nums").data(numbers);
  var text = g.selectAll("numtext").data(numbers);
  numpad.enter().append("rect")
    .attr("x", function(d, i) { return width/2 - cols*50/2; })
    .attr("y", function(d, i) { return height/2 - rows*50/2; })
    .attr("width", 40)
    .attr("height", 40)
    .style("fill", "#F44336");

  text.enter().append("text")
    .text(function(d, i) { return d; } )
    .attr("x", function(d, i) { return width/2 - cols*40/2; })
    .attr("y", function(d, i) { return height/2 - rows*40/2; })
    .style("fill", "#F4F4F4")
    .style("cursor", "default");

  numpad.transition().duration(750)
    .attr("x", function(d, i) { return width/2 - cols*50/2 + (i%cols)*50; })
    .attr("y", function(d, i) { return height/2 - rows*50/2 + Math.trunc(i/rows)*50; });

  text.transition().duration(750)
    .attr("x", function(d, i) { return width/2 - cols*40/2 + (i%cols)*50; })
    .attr("y", function(d, i) { return height/2 - rows*40/2 + Math.trunc(i/rows)*50; });


  numpad.on("click.numpad", function(d, i) { console.log(d3.select(this).data()); d3.select("svg").remove(); createGo(); });
  text.on("click.numpad", function(d, i) { console.log(d3.select(this).data()); d3.select("svg").remove(); createGo(); });
}

function addTrialData(err, time) {
  data.trials[trialNumber] = { "id": trialNumber, "errors": err, "time": time };
  trialNumber += 1;
}

function getTrialData() {
  return data;
}
