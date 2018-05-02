function distance(ptA, ptB) {
    var diff = [ptB[0] - ptA[0], ptB[1] - ptA[1]];
    return Math.sqrt(diff[0] * diff[0] + diff[1] * diff[1]);
}
