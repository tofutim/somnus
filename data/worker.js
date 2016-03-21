self.onmessage = function(msg) {
  self.postMessage('hello ' + msg.data);
};

self.onerror = function(msg) {
  self.postMessage('error: ' + msg);
};

var user32 = ctypes.open("user32.dll");
var msgBox = user32.declare("MessageBoxW",
                         ctypes.winapi_abi,
                         ctypes.int32_t,
                         ctypes.int32_t,
                         ctypes.jschar.ptr,
                         ctypes.jschar.ptr,
                         ctypes.int32_t);


var MB_OK = 0;
var ret = msgBox(0, "Hello world", "title", MB_OK);

user32.close();
