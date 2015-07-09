var chart = StreamScatterPlot()
    .x(function(d) { return +d.timeoffset; })
    .y(function(d) { return +d.value; })
    .flag(function(d) { return d.flag; })
    .id(function(d) { return d.id; })
    .width(600)
    .height(310)
    .pointRadius(6)
    .allowZoom(false)
    .allowPause(true);

//Holds the value of it's corresponding menu
var cursor, freeze, manual, accumulate, interval, clockdrift;

//Set handlers for each menu
var cursorMenu = d3.select("#cursormenu select")
	.on("change.cursor", change);

var freezeMenu = d3.select("#freezemenu select")
	.on("change.freeze", change);

var onManualMenu = d3.select("#onmanualmenu select")
	.on("change.manual", change);

var accumulateMenu = d3.select("#accumulatemenu select")
	.on("change.accumulate", change);

var trailMenu = d3.select("#trailmenu select")
	.on("change.trailMenu", change);

var intervalMenu = d3.select("#intervalmenu select")
	.on("change.interval", change);

var intervalInput = d3.select("#intervalinput")
	.on("change.customInterval", setInterval);

var numIntervalInput = d3.select("#numintervalsinput")
	.on("change.numIntervals", setNumIntervals);

var clockdriftInput = d3.select("#clockdriftinput")
	.on("change.numIntervals", setClockDrift);

clockdriftInput.property("value", 0);
setClockDrift();

//Load JSON file
d3.json("data/stream_test.json", function(error, data) {
	if (error) {
		console.log(error);
	} else {
		console.log(data);
	}

  data = data[0];

	//Adds current time to time offset to simulate a realtime dataset
	var now = new Date();
	data.forEach(function (d) {
		d.timeoffset = (now - (20) * 1000) + d.timeoffset * 1000;
		d.timeoffset = +d.timeoffset;
		d.value = +d.value;
		d.primary = d.primary;
		d.secondary = d3.secondary;
	});

	//Now loading in whole datastream! StreamScatterPlot has been fixed to handle large dataset's itself
	var stream = d3.select("#StreamScatterPlot")
		.datum(data)
		.call(chart);

	//Start streaming of chart
	chart.start();
	intervalMenu.property("value", "1 second");
	numIntervalInput.property("value", "20");
	trailMenu.property("value", "false");
	change();
});

//Update current selectors
d3.timer(function() {
	//Redraw cursor selector
	if (cursor == "NormalCursor") {
		NormalCursor.redraw();
	} else  if (cursor == "BubbleCursor") {
		BubbleCursor.redraw();
		// NormalCursor.redraw();
	}

	//Redraw freeze selector
	if (freeze == "FreezeAroundCursor") {
		FreezeAroundCursor.redraw();
	} else if (freeze == "FreezeAroundClosest") {
		FreezeAroundClosest.redraw();
	} else if (freeze == "FreezeTrajectory") {
		FreezeTrajectory.redraw();
	}
});

function setInterval() {
	intervalMenu.property("value", "custom");
	StreamScatterPlot.setInterval(intervalInput.property("value"));
}

function setNumIntervals() {
	StreamScatterPlot.setNumIntervals(numIntervalInput.property("value"));
}

function setClockDrift() {
	StreamScatterPlot.setClockDrift(clockdriftInput.property("value"));
}

function change() {
	//Obtain options from menus
	cursor = cursorMenu.property("value");
	freeze = freezeMenu.property("value");
	manual = onManualMenu.property("value");
	accumulate = accumulateMenu.property("value");
	interval = intervalMenu.property("value");

	//Grab Svg
	var svg = d3.select("svg").data(StreamScatterPlot.getData());

	//Remove any old cursor / freeze
	d3.selectAll(".selector").remove();
	d3.selectAll(".snapshots").remove();
	d3.select("#freezeClip").remove();
	d3.selectAll(".point").attr("id", "untagged");
	d3.select("body").on("keydown.freezeSelector", null);
	d3.selectAll(".trail").remove();
	d3.selectAll(".target").attr("class", function() { return d3.select(this).attr("class").slice(0, -7); });
	svg.on("mousemove.freezeSelector", null);
	svg.on("mousemove.cursorSelector", null);
	svg.on("mousemove.cursorSelector", null);

	//Convert choice to bool
	var choice = trailMenu.property("value");
	if (choice == "true") {
		choice = true;
	} else {
		choice = false;
	}
	StreamScatterPlot.setTrails(choice);

	//Set interval
	if (interval == "10 second") {
		StreamScatterPlot.setInterval(10000);
		intervalInput.property("value", 10000);
	} else if (interval == "2 second") {
		StreamScatterPlot.setInterval(2000);
		intervalInput.property("value", 2000);
	} else if (interval == "1 second") {
		StreamScatterPlot.setInterval(1000);
		intervalInput.property("value", 1000);
	} else if (interval == "500 millisecond") {
		StreamScatterPlot.setInterval(500);
		intervalInput.property("value", 500);
	} else if (interval == "250 millisecond") {
		StreamScatterPlot.setInterval(250);
		intervalInput.property("value", 250);
	} else if (interval == "1 millisecond") {
		StreamScatterPlot.setInterval(1);
		intervalInput.property("value", 1);
	} else if (interval == "custom") {
		StreamScatterPlot.setInterval(+intervalInput.property("value"));
	}

	//Convert manual to bool
	if (manual == "true") {
		manual = true;
	} else {
		manual = false;
	}

	//Convert accumulate to bool
	if (accumulate == "true") {
		accumulate = true;
	} else {
		accumulate = false;
	}

	//Set freeze selector
	if (freeze == "FreezeWholeScreen") {
		FreezeWholeScreen(svg);
	} else if (freeze == "FreezeAroundCursor"){
		FreezeAroundCursor(svg, manual);
		FreezeAroundCursor.accumulate(accumulate);
	} else if (freeze == "FreezeAroundClosest") {
		FreezeAroundClosest(svg, manual);
		FreezeAroundClosest.accumulate(accumulate);
	} else if (freeze == "FreezeTrajectory") {
		FreezeTrajectory(svg, manual);
		FreezeTrajectory.accumulate(accumulate);
	}

	//Set cursor selector
	if (cursor == "NormalCursor") {
		NormalCursor(svg);
		if (freeze != "None") NormalCursor.tarName(".snapshot");
	} else  if (cursor == "BubbleCursor") {
		// NormalCursor(svg);
		BubbleCursor(svg);
		if (freeze != "None") BubbleCursor.tarName(".snapshot");
	}
}
