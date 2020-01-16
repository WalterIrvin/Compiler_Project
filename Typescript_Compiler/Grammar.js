"use strict";
exports.__esModule = true;
var Grammar = /** @class */ (function () {
    function Grammar(inputStr) {
        this.m_grammarSet = new Set();
        var varList = inputStr.split("\n");
        for (var i = 0; i < varList.length - 1; i++) {
            var splitList = varList[i].split(" -> ", 2);
            var leftSide = "null";
            var rightSide = "null";
            if (splitList.length == 2) {
                leftSide = splitList[0];
                rightSide = splitList[1];
                var terminalRegex = RegExp(rightSide);
                if (this.m_grammarSet.has(leftSide)) {
                    throw new Error("Error: variable redeclaration " + leftSide);
                }
                this.m_grammarSet.add(leftSide);
                console.log(leftSide + " : " + rightSide);
            }
            else {
                throw new Error("Invalid syntax, -> not found with the variable declaration " + varList[i]);
            }
        }
    }
    return Grammar;
}());
exports.Grammar = Grammar;
