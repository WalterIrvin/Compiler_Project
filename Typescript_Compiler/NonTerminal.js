"use strict";
exports.__esModule = true;
var NonTerminal = /** @class */ (function () {
    function NonTerminal(label) {
        this.label = label;
        this.neighbors = [];
    }
    NonTerminal.prototype.setNeighbors = function (neighborList) {
        this.neighbors = neighborList;
    };
    NonTerminal.prototype.addNeighbors = function (neighborList) {
        var _this = this;
        neighborList.forEach(function (item) {
            //appends new neighbors like using | would do
            _this.neighbors.push(item);
        });
    };
    return NonTerminal;
}());
exports.NonTerminal = NonTerminal;
//# sourceMappingURL=NonTerminal.js.map