function FreezeWholeScreen(selection) {
    //Name of svg element to grab for targets
    var targets = '.point';

    //Element that contains the 'snapshots' of frozen data
    var gCopies = selection.insert('g', '.chart').attr('class', 'snapshots');

    //Freeze when user hits shift / Clear when user hits C
    d3.select('body').on('keydown.freezeSelector', function() {
        if (d3.event.shiftKey) {
            FreezeWholeScreen.freeze();
        } else if (d3.event.keyCode == 67) {
            FreezeWholeScreen.cleanSnapshots();
        }
    });

    FreezeWholeScreen.destroy = function() {
        d3.select('body').on('keydown.freezeSelector', null);
        gCopies.remove();
    };

    //Freezes all the data points currently shown
    FreezeWholeScreen.freeze = function() {
        // FreezeWholeScreen.cleanSnapshots();
        FreezeWholeScreen.createSnapshots();
    };

    //Create snapshots of data points inside the freeze region
    FreezeWholeScreen.createSnapshots = function() {
        var points = d3.selectAll(targets);
        points.each(function(d, i) {
            var pt = d3.select(this);
            if (pt.attr('class').includes('duped')) {
                pt.attr('class', d[2].replace('point', '') + 'i' + d[3].replace('copy', '') + ' snapshot');
            } else {
                pt.attr('id', 'tagged');
            }
        });
    };

    //Destroy all snapshots
    FreezeWholeScreen.cleanSnapshots = function() {
        d3.selectAll(targets).attr('id', 'untagged');
        d3.selectAll('.snapshot').attr('class', function(d) {
            return d[2];
        });
    };

    //Set the class name used to obtain targets
    FreezeWholeScreen.tarName = function(_) {
        if (!arguments.length) return targets;
        targets = _;
        return FreezeWholeScreen;
    };
}
