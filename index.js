var self = require("sdk/self");
var {ChromeWorker} = require("chrome");
var { setTimeout } = require("sdk/timers");


var workerUrl = self.data.url("worker.js");
console.log("workerUrl: " + workerUrl);

var worker = new ChromeWorker(workerUrl);
worker.onmessage = function(e) {
  console.log(e.data);
};
worker.postMessage("Tim");

// test termination
/*
var _worker = worker;
setTimeout(function() {
    _worker.terminate();    /// yah this is bad
},10000);
*/
