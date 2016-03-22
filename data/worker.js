self.onerror = function(msg) {
    self.postMessage('error: ' + msg);
};

importScripts("resource://gre/modules/workers/require.js");
importScripts("resource://somnus/data/ostypes/ostypes_win.jsm");
importScripts("resource://somnus/data/ipcClient.js");
var MB_OK = 0;

//var ret = ostypes.API('MessageBox')(ostypes.TYPE.HWND(0), "Ready?", "title", MB_OK);

var client = new IpcClient('loqu8.cigar',
  client_pipeRead,
  client_pipeClosed);

self.onmessage = function(msg) {
    if (msg.data == 'shutdown') {
        self.postMessage('shutting down...');
        client.close();         // cancelIo, close pipeHandle
    } else {
        self.postMessage('worker received: ' + msg.data);
    }
//    client.send(msg.data);
    /*
    self.postMessage('received ' + msg.data);
    if (msg.data == 'shutdown') {
        self.postMessage('shutting down...');
        client.close();
    }
    */
};

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
  self.postMessage(str);
  client.send("data");
//  client.readAsync();
}

function client_pipeClosed()
{
    self.postMessage('pipe closed');
    resetClient();
}
