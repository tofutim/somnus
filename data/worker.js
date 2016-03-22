self.onerror = function(msg) {
self.postMessage('error: ' + msg);
};

self.onmessage = function(msg) {
  self.postMessage('hello ' + msg.data);
};

console.log('hello world from the worker');     // doesn't show yet?

self.postMessage('importing...');
importScripts("resource://gre/modules/workers/require.js");
importScripts("resource://somnus/data/ostypes/ostypes_win.jsm");
importScripts("resource://somnus/data/ipcClient.js");
self.postMessage('import complete');
var MB_OK = 0;

var ret = ostypes.API('MessageBox')(ostypes.TYPE.HWND(0), "Ready?", "title", MB_OK);

var client = new IpcClient('loqu8.cigar',
  client_pipeRead,
  client_pipeClosed);
resetClient();

function resetClient()
{
  var _client = client;
  client.connect(function() {
    _client.readAsync();
  });
}

function client_pipeRead(pBuffer, readLen)
{
  // TODO: convert to string
//  console.log(pBuffer);
  var str = pBuffer.readString();
  console.log(str);
  client.sendAsync("data");
}

function client_pipeClosed()
{
  resetClient();
}

    /*
    var jsCallback = function(lpParameter, TimerOrWaitFired) {
  	  console.log('lpParameter:', lpParameter, 'TimerOrWaitFired:', TimerOrWaitFired);
  	  return undefined;
  	};

  	var cCallback = ostypes.TYPE.WAITORTIMERCALLBACK.ptr(jsCallback);

  	var hNewTimer = ostypes.TYPE.HANDLE();
  	//hNewTimer = hNewTimer;
  	var ret = ostypes.API('CreateTimerQueueTimer')(
  	  hNewTimer.address(),
  	  null,
  	  cCallback,
  	  null,
  	  5000,
  	  0,
  	  ostypes.CONST.WT_EXECUTEDEFAULT
  	);

  	console.log('ret:', ret, 'winLastError:', ctypes.winLastError);
  	console.log('hNewTimer:', hNewTimer.toString());
    */
