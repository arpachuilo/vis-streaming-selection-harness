// NOTE: Any useful variables to alter will have a comment starting with ***
//Hold data collected
var data = {};
var worker_id = experimentr.workerId();

var stream_file;
//Hold per combination trial numbers
var trialNumber = 0;
var numTrials = 0;

//Holds entire dataset used
var dataset;

var setNumber = 0;

//Holds combination number
var experiment_number = 0;
var experiment_length = 0;

var global_trial_id = 0;
var unique_id = 0;

var practice_number = 0;
var times_practiced = 0;

// NOTE: Any useful variables to alter will have a comment starting with ***
var width = 900; //***
var height = 900; //*** these control size of click area

var showAnswers = true //*** useful debug
var responsePause = 1000 // how many ms it takes before you can give a response (prevent accidental clicks)

var numRequiredPracticeTrials = 1 //*** how many times MUST they practice? (not optional)
var firstPracticeLength = 10 * 1000 //*** make users first practice longer

var minTimePeriod = 5000 //*** (ms) min time limit for clicking during trials seconds NOTE: this should be greater or equal to dotDurationMin
var extraPossibleTime = 5000 //*** (ms) amount of extra possible time for clicking
var practiceLengthFunc = function () { return ((Math.random() * extraPossibleTime) + minTimePeriod) }
var trialLengthFunc = function () { return ((Math.random() * extraPossibleTime) + minTimePeriod) }

var trialsPerCombination = 5

// Will control perceived density
// var percentDistractors = 0.1 // 33% dots are blue
// NOTE: this will control max number of dots via dotDurationMin / dotEveryMS = fully saturated (max) number of dots
// NOTE: this max can vary when the speed varies --- measures were taken to keep this from effecting number of blue dots
var dotEveryMS = 50 //*** dots come up every XXXms

// Will control perceived speed
// These control how long it takes a dot to move across the vis
var dotDurationMin = 5000 //*** dots will take at least XXXms to travel across NOTE: should be as low as minTimePeriod
var dotDurationRand = 2000 //*** dots may have up to XXXms subtracted from their duration

var numBlueOnScreenRange = [5, 13] //*** controls the number of blue dots on the screen NOTE: will saturate once reaches dotDurationMin

// Controls when the first red dot should appear by index
var firstRedIndexMin = 1 //*** first red will at least be the starting at index X
var firstRedIndexRand = 3 //*** first red dot may be up to index X

// NOTE: 2d study variables
// (2x - existence of varying speed) * ((3x - proxy method) * (3x - trail method) + (1 - no proxy method))

var chart = StreamScatterPlot()
    .x(function(d) { return +d.x; })
    .y(function(d) { return +d.y; })
    .flag(function(d) { return d.flag; })
    .id(function(d) { return d.id; })
    .toX(function(d) { return +d.toX; })
    .toY(function(d) { return +d.toY; })
    .duration(function(d) { return +d.duration; })
    .entry(function(d) { return +d.entry; })
    .width(width)
    .height(height)
    .allowZoom(false)
    .allowPause(false)
    .allowTrails(false);

var cursorFunc = null;
var freezeFunc = null;

var previousFrz = "";
var previousTrail = "";

var practice = false;
var first_practice = false;

var experiment_sequence = [];
var trail = ["none", "ghost", "trail"];
var speeds = [
    {"speed": "vary"},
    {"speed": "constant"}
];

function shuffle(o){
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

//Generate trial sequence
d3.json("data/sequence.json", function(error, data) {
    var sequence = data.sequence;

    var n = 0;
    //4X Technique
    for (i = 0; i < sequence.length; i++) {
        var freezeType = sequence[i];
        //3X Trail
        shuffle(trail);
        for (j = 0; j < 3; j++) {
            var trailType = trail[j];
            if (freezeType == "none") {
                trailType = "none";
                j = 4;
            }
            // 2X Speed
            shuffle(speeds);
            for (k = 0; k < 2; k++) {
                var speed = speeds[k].speed;
                experiment_sequence[n] = {};
                experiment_sequence[n].freezeType = freezeType;
                experiment_sequence[n].trailType = trailType;
                experiment_sequence[n].speed = speed;
                n += 1;
            }
        }
    }

    experiment_length = experiment_sequence.length;
    loadNextTrial();
});

// Make datasets
function load(size, speed, callback) {
  dataset = []

  // Number of sets we want
  for (var i = 0; i < size; i++) {
    dataset.push([])

    // Size of each set
    var entryTime = 0
    var firstPrimary = Math.round(Math.random() * firstRedIndexRand) + firstRedIndexMin
    var totalNumDots = ((1 + minTimePeriod + extraPossibleTime) * 1000) / dotEveryMS
    var blueTimer = 0
    var blueEveryMS = Math.floor(dotDurationMin / (Math.floor(Math.random() * (numBlueOnScreenRange[1] - numBlueOnScreenRange[0])) + numBlueOnScreenRange[0]))
    for (var j = 0; j < totalNumDots; j++) {

      var d = {}
      if (j === firstPrimary) {
        d.flag = 'primary point'
      } else if (blueTimer >= blueEveryMS) {
        blueTimer = 0
        d.flag = 'secondary point'
      } else {
        d.flag = 'point'
      }

      blueTimer += dotEveryMS

      d.id = j

      // Determine which wall to start on
      var side = Math.round(Math.random() * 3)
      if (side === 0) { // top
        d.y = 0
        d.x = Math.random() * width
        d.toY = height
        d.toX = Math.random() * width
      } else if (side === 1) { // left
        d.x = 0
        d.y = Math.random() * height
        d.toX = width
        d.toY = Math.random() * height
      } else if (side === 2) { // bottom
        d.y = height
        d.x = Math.random() * width
        d.toY = 0
        d.toX = Math.random() * width
      } else { // right
        d.x = width
        d.y = Math.random() * height
        d.toX = 0
        d.toY = Math.random() * height
      }

      d.entry = entryTime
      if (speed === 'vary' && d.flag !== 'secondary point') {
        d.duration = dotDurationMin - Math.random() * dotDurationRand;
      } else {
        d.duration = dotDurationMin
      }
      entryTime += dotEveryMS

      dataset[i].push(d)
    }
  }

  numTrials = dataset.length

  if (typeof callback == "function") {
      callback();
  }
}

//Create chart
function createChart(_speed, _trail) {
  var num_load = trialNumber;
  if (practice) {
      num_load =  Math.floor((Math.random() * 14));
  }

  //Create chart with specified data
  var stream = d3.select("#trialsChart")
    .datum(dataset[num_load])
    .call(chart);

  if (first_practice) {
    StreamScatterPlot.setClickPeriod(firstPracticeLength);
    first_practice = false;
  } else if (practice) {
    StreamScatterPlot.setClickPeriod(practiceLengthFunc());
  } else {
    StreamScatterPlot.setClickPeriod(trialLengthFunc());
  }

  //Set trail modifier
  if (_trail === "none") {
      d3.select("#trails").html(
        "#tagged.point {" +
            "fill-opacity: 0.0 !important;" +
            "stroke-opacity: 0.0 !important;" +
        "}"
      );
      StreamScatterPlot.setTrails(false);
  } else if (_trail === "trail") {
      d3.select("#trails").html(
        "#tagged.point {" +
            "fill-opacity: 0.5 !important;" +
            "stroke-opacity: 0.5 !important;" +
        "}"
      );
      StreamScatterPlot.setTrails(true);
  } else {
      d3.select("#trails").html(
        "#tagged.point {" +
            "fill-opacity: 0.5 !important;" +
            "stroke-opacity: 0.5 !important;" +
        "}"
      );
      StreamScatterPlot.setTrails(false);
  }

  //Start streaming
  chart.start();
}

//Redraw Cursors as needed
d3.timer(function() {
  if (cursorFunc == "normal") {
		NormalCursor.redraw();
	} else  if (cursorFunc == "bubble") {
		BubbleCursor.redraw();
	}

  if (freezeFunc == "FreezeAroundCursor") {
    FreezeAroundCursor.redraw();
  } else if (freezeFunc == "FreezeAroundClosest") {
    FreezeAroundClosest.redraw();
  } else if (freezeFunc == "FreezeTrajectory") {
    FreezeTrajectory.redraw();
  }
});

//Create Cursor
function setSelectors(cursorType, freezeType) {
  var svg = d3.select("svg").data(StreamScatterPlot.getData());

  d3.select("body").on("keydown.freezeSelector", null);
  svg.on("mousemove.freezeSelector", null);
  svg.on("mousemove.cursorSelector", null);

  //Set freeze selector
  if (freezeType == "FreezeWholeScreen") {
    FreezeWholeScreen(svg);
    freezeFunc = freezeType;
  } else if (freezeType == "FreezeAroundCursor"){
    FreezeAroundCursor(svg, true);
    freezeFunc = freezeType;
  } else if (freezeType == "FreezeAroundClosest") {
    FreezeAroundClosest(svg, true);
    freezeFunc = freezeType;
  } else if (freezeType == "FreezeTrajectory") {
    FreezeTrajectory(svg, true);
    freezeFunc = freezeType;
  }

  //Set cursor selector
  if (cursorType == "normal") {
    NormalCursor(svg);
    cursorFunc = cursorType;
    if (freezeType != "none") NormalCursor.tarName(".snapshot");
  } else  if (cursorType == "bubble") {
    BubbleCursor(svg);
    cursorFunc = cursorType;
    if (freezeType != "none") BubbleCursor.tarName(".snapshot");
  }
}

//Loads up chart streaming once GO is clicked
function createGo() {
    if (practice) {
        d3.select("#trialsChart").html("");
        loadNextTrial();
        return;
    }
    var svg = d3.select("#trialsChart").append("svg")
        .attr("id", "go")
        .attr("width", width)
        .attr("height", height);

    svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .style("stroke", "black")
        .style("fill", "none")
        .style("stroke-width", "1px");

    var r = 100
    var g = svg.append("g").attr("class", "goButton");
    var goCircle = g.append("circle")
        .attr("cx", width/2)
        .attr("cy", height/2)
        .attr("r", r)
        .style("fill", "#8BC34A");

    var _freeze = experiment_sequence[experiment_number].freezeType;
    var _trail= experiment_sequence[experiment_number].trailType;

    var t = (previousFrz != _freeze || previousTrail != _trail) ? 'DONE' : 'GO'
    var goText = g.append("text")
        .attr("x", width/2)
        .attr("y", height/2)
        .attr("dy", r/2 - 25)
        .style("font-family", "sans-serif")
        .style("font-size", "50px")
        .style("fill", "#F4F4F4")
        .style("cursor", "default")
        .style('text-anchor', 'middle')
        .text(t);

    g.on("click.go", function() {
        g.on("click.go", null);
        svg.remove();
        d3.select("#trialsChart").html("");
        loadNextTrial();
    });
}

//Loads up secondary task question
function createQuestion(err, time, dis, click_period, dots_c, dots_m, nums_freezed, nums_cleared, errors_air, dots_array) {
    var svg = d3.select("#trialsChart").append("svg")
        .attr("id", "question")
        .attr("width", width)
        .attr("height", height);

    svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .style("stroke", "black")
        .style("fill", "none")
        .style("stroke-width", "1px");

    var numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    var g = svg.append("g").attr("class", "questionNumpad");
    var numpad = g.selectAll(".numpad").data(numbers);
    var numpadText = g.selectAll(".numpadText").data(numbers);

    numpad.enter().append("rect")
        .attr("class", "numpad")
        .attr("x", function(d, i) { return width/2 - numbers.length/2 * 40 + i*40; })
        .attr("y", height/2)
        .attr("width", 35)
        .attr("height", 35)
        .style("fill", "#E57373");

    numpadText.enter().append("text")
        .attr("class", "numpadText")
        .text(function(d, i) { return d; } )
        .attr("x", function(d, i) { return width/2 - numbers.length/2 * 40 + i*40 + 35/2; })
        .attr("y", height/2 + 35/2 + 12/2)
        .style("fill", "#F4F4F4")
        .style("cursor", "default")
        .style("text-anchor", "middle");

    var question = g.append("text")
        .text("How many blue dots were on the screen at the end?")
        .attr("x", width/2)
        .attr("y", height/2 - 35)
        .style("fill", "#0F0F0F")
        .style("cursor", "default")
        .style("font-size", "25")
        .style("text-anchor", "middle");

    setTimeout(function() {
        numpad
            .style("fill", "#8BC34A")
            .on("click.numpad", click_handler);
        numpadText
            .on("click.numpadText", click_handler);
    }, responsePause);

    function click_handler() {
        var ans = d3.select(this).data();

        numpadText.on("click.numpadText", null);
        numpad.on("click.numpad", null);
        svg.remove();
        d3.select("#trialsChart").html("");

        if (showAnswers) {
            d3.select("#question_info").html(
                "<b>Distractors that were on screen: </b>" + dis +
                "<b><br>Your answer: </b>" + ans[0] +
                "<b><br>Number of dots you clicked: </b>" + dots_c
            );
        }

        addTrialData(err, time, dis, ans[0], click_period, dots_c, dots_m, nums_freezed, nums_cleared, errors_air, dots_array);
        if (experiment_number + 1 == experiment_length && trialNumber + 1 >= numTrials) {
            goToNext();
        } else {
            createGo();
        }
    }
}

function startPractice(callback) {
    var svg = d3.select("#trialsChart").append("svg")
      .attr("id", "go")
      .attr("width", width)
      .attr("height", height);

    svg.append("rect")
               .attr("x", 0)
               .attr("y", 0)
               .attr("width", width)
               .attr("height", height)
               .style("stroke", "black")
               .style("fill", "none")
               .style("stroke-width", "1px");

   var g = svg.append("g").attr("class", "practice");
   var practiceBtn = g.append("rect")
       .attr("x", width/4)
       .attr("y", height/4)
       .attr("rx", 100)
       .attr("ry", 100)
       .attr("width", width/2)
       .attr("height", height/2)
       .style("fill", "#2196F3");

   var practiceBtn = g.append("text")
       .attr("x", width/2)
       .attr("y", height/2 + 50/2)
       .style("font-family", "sans-serif")
       .style("font-size", "50px")
       .style("fill", "#F4F4F4")
       .style("cursor", "default")
       .style("text-anchor", "middle")
       .text("PRACTICE");

       g.on("click.practice", function() {
           g.on("click.practice", null);
           svg.remove();
           callback();
       });
}

function createPractice() {
    var _freeze = experiment_sequence[experiment_number].freezeType;
    var _trail= experiment_sequence[experiment_number].trailType;

    var instructions = d3.select("#instructions");
    var instructionsText;
    if (_freeze === "FreezeWholeScreen") {
        instructionsText = "<h3>Freeze Whole Screen</h3><p> The freeze region for this technique is the whole screen and therefore no highlighted region will be displayed.</p><img src='images/freeze_whole.png'><p><b>'Shift'</b> to freeze the all the dots on the screen.</p><p><b>'C'</b> to clear the dots you froze previously.</p>";
    } else if (_freeze === "FreezeTrajectory") {
        instructionsText = "<h3>Freeze Trajectory</h3><p> The highlighted region for this technique is a cone/flashlight like region drawn in the direction of your cursors movement.</p><img src='images/freeze_trajectory.png'><p><b>'Shift'</b> to freeze the dots inside the highlighted region.</p><p><b>'C'</b> to clear the dots you froze previously.</p>"
    } else if (_freeze === "FreezeAroundClosest") {
        instructionsText = "<h3>Freeze Around Closest</h3><p> The highlighted region for this technique is a circle created around the closest dot/square to your cursor.</p><img src='images/freeze_closest.png'><p><b>'Shift'</b> to freeze the dots inside the highlighted region.</p><p><b>'C'</b> to clear the dots you froze previously.</p>";
    } else if (_freeze === "FreezeAroundCursor") {
        instructionsText = "<h3>Freeze Around Cursor</h3><p> The highlighted region for this technique is a circle created around your cursor.</p><img src='images/freeze_cursor.png'><p><b>'Shift'</b> to freeze the dots inside the highlighted region.</p><p><b>'C'</b> to clear the dots you froze previously.</p>";
    } else if (_freeze === "none") {
        instructionsText = "<h3>No Freeze</h3><p>No freeze technique to aid you.</p><img src='images/freeze_none.png'>";
    }
    instructions.html(instructionsText);

    d3.select("#trainInfo").append("div")
        .attr("id", "question_info");

    var trainInfoBox = d3.select("#trainInfo").append("div")
        .attr("class", "training_info");

    var text = trainInfoBox.append("div")
        .attr("class", "train_text");

    text.html(
        "<b>Freeze Technique: </b>" + _freeze + "<br>" +
        "<b>Visual Cue: </b>" + _trail + "<br>"
    )

    var button = trainInfoBox.append("div")
        .attr("id", "train_div");

    button
        .append("button")
            .attr("id", "train_button")
            .text("DONE TRAINING")
            .attr("disabled", "disabled")
            .style("display", "none");

    d3.select("#trialInfo").html("");

    button.on("click.train", function() {
        if (!first_practice) chart.destroy();
        practice = false;
        first_practice = false;
        var t_id = "number_of_practice_trials_" + _freeze + "_" + _trail + "_";
        data[t_id] = times_practiced;
        experimentr.endTimer('practice_' + _freeze + "_" + _trail);
        button.on("click.train", null);
        d3.select("#trialsChart").html("");
        d3.select("#trainInfo").html("");
        d3.select("#instructions").html("");
        createGo();
    });
};

function loadNextTrial() {
    //load and display trial information
    var _freeze = experiment_sequence[experiment_number].freezeType;
    var _trail = experiment_sequence[experiment_number].trailType;
    var _speed = experiment_sequence[experiment_number].speed;

    if(!practice) {
        d3.select("#trainInfo").html("");
        unique_id = (Math.floor(Math.random()*90000) + 10000).toString(36)
        d3.select("#trialInfo").html(
            // "<b>Trial ID: </b>" + unique_id + "<br>" +
            "<div style='float: right;'><b>ID: </b>" + unique_id + "<br></div>" +
            "<b>Freeze Selector: </b>" + _freeze + "<br>" +
            "<b>Visual Cue: </b>" + _trail + "<br>"
        );
    }

    if (previousFrz != _freeze || previousTrail != _trail) {
        previousFrz = _freeze;
        previousTrail = _trail;
        practice = true;
        times_practiced = 0;
        experimentr.startTimer('practice_' + _freeze + "_" + _trail);
        first_practice = true;
        practice_number = Math.floor((Math.random() * (speeds.length - 1)))
        createPractice()
    }

    if (practice) {
        _practice_speed = speeds[practice_number].speed;
        startPractice(function() {
            load(15, _practice_speed, function() {
                createChart(_practice_speed, _trail);
                setSelectors("normal", _freeze);
            });
        });
        practice_number += 1;
        times_practiced += 1;

        if (times_practiced > numRequiredPracticeTrials) {
            d3.select("#train_button")
                .attr("disabled", null)
                .style("display", "");
        }
        if (practice_number > speeds.length - 1)
            practice_number = 0;
    } else {
        if (trialNumber == 0) {
            load(trialsPerCombination, _speed, function() {
                createChart(_speed, _trail);
                setSelectors("normal", _freeze);
            });
        } else {
            createChart(_speed, _trail);
            setSelectors("normal", _freeze);
        }
    }
}

function addTrialData(err, time, dis, dis_ans, click_period, dots_c, dots_m, nums_freezed, nums_cleared, errors_air, dots_array) {
    if (!practice) {

        var _freeze = experiment_sequence[experiment_number].freezeType;
        var _trail = experiment_sequence[experiment_number].trailType;
        var _speed = experiment_sequence[experiment_number].speed;

        var t_id = _freeze + "_" + _trail + "_" + _speed + "_" + trialNumber;

        var id_glob = "global_id_" + t_id;
        var id_uniq = "unique_id_" + t_id;
        var id_file = "file_" + t_id;
        var id_err = "errors_" + t_id;
        var id_err_air = "errors_clicked_nothing_" + t_id;
        var id_time = "time_" + t_id;
        var id_dis = "num_distractors_" + t_id;
        var id_dis_ans = "distractors_answer_" + t_id;
        var id_dots_c = "dots_clicked_" + t_id;
        var id_dots_m = "dots_missed_" + t_id;
        var id_click_period = "click_time_period_" + t_id;
        var id_nums_freeze = "freezes_usesd_" + t_id;
        var id_nums_cleared = "clears_usesd_" + t_id;
        var id_dots_clicked_info = "detailed_click_info_" + t_id;

        data[id_glob] = global_trial_id;
        data[id_uniq] = unique_id;
        data[id_file] = stream_file;
        data[id_err] = err;
        data[id_err_air] = errors_air;
        data[id_time] = time;
        data[id_dis] = dis;
        data[id_dis_ans] = dis_ans;
        data[id_dots_c] = dots_c;
        data[id_dots_m] = dots_m;
        data[id_click_period] = click_period;
        data[id_nums_freeze] = nums_freezed;
        data[id_nums_cleared] = nums_cleared;
        data[id_dots_clicked_info] = dots_array

        global_trial_id += 1;
        trialNumber += 1;

        if (trialNumber >= numTrials) {
            trialNumber = 0;
            experiment_number += 1;
        }

        experimentr.addData(data);
        data = {};
    }
}

function goToNext() {
    experimentr.endTimer("all_trials");
    experimentr.addData(data);
    experimentr.next();
}
