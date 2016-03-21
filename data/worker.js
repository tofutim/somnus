self.onerror = function(msg) {
  self.postMessage('error: ' + msg);
};

self.onmessage = function(msg) {
  self.postMessage('hello ' + msg.data);
};

self.postMessage('importing...');
importScripts("resource://gre/modules/workers/require.js");
importScripts("resource://somnus/data/ostypes/ostypes_win.jsm");
self.postMessage('imported');
var MB_OK = 0;

var ret = ostypes.API('MessageBox')(ostypes.TYPE.HWND(0), "Hello world", "title", MB_OK);

function jsCallback(lpParameter, TimerOrWaitFired) {
  self.postMessage('lpParameter: ' + lpParameter);
  self.PostMessage('TimerOrWaitFired: ' + TimerOrWaitFired);
  return undefined;
}
cCallback = ostypes.TYPE.WAITORTIMERCALLBACK.ptr(jsCallback);
var mynumber = ctypes.uint32_t(7);
var hNewTimer = ostypes.TYPE.HANDLE(0);
ret = ostypes.API('CreateTimerQueueTimer')(
  hNewTimer.address(),
  null,
  cCallback,
  null,
  5000,
  0,
  0x00000000
);
