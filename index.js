var self = require("sdk/self");
var {ChromeWorker} = require("chrome");

var workerUrl = self.data.url("worker.js");
console.log("workerUrl: " + workerUrl);

var worker = new ChromeWorker(workerUrl);
worker.onmessage = function(e) {
  console.log(e.data);
};
worker.postMessage("Tim");
