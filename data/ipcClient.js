var IpcClient = function IpcClient(pipeName, pipeRead, pipeClosed) {
  this.pipeName = pipeName;
  this.pipeRead = pipeRead;
  this.pipeClosed = pipeClosed;

  this.init();
}

IpcClient.prototype = {
  init: function() {
    this.overlapped = new ostypes.TYPE.OVERLAPPED;
    this.cReadCallback = ostypes.TYPE.LPOVERLAPPED_COMPLETION_ROUTINE(this.readCallback);
    console.log("cReadCallback: " + this.cReadCallback);
  },
  connect: function(callback) {
    var result = false;

    if (typeof this.pipeHandle != 'undefined' && this.pipeHandle != ctypes.voidptr_t(0)) {
      closeHandle(this.pipeHandle);
    }

    let pipeMode = (ostypes.CONST.GENERIC_READ | ostypes.CONST.GENERIC_WRITE) >>> 0;
    let pipePath = "\\\\.\\pipe\\" + this.pipeName;

    // this perhaps should be in its own world
    console.log('Attemting connect to ' + pipePath + '...')
    // http://stackoverflow.com/questions/6961240/problem-reconnecting-to-the-named-pipe
    this.pipeHandle = ostypes.API('CreateFile')(pipePath,
      pipeMode,
      0,
      null,
      ostypes.CONST.OPEN_EXISTING,
      ostypes.CONST.FILE_FLAG_OVERLAPPED,
      null);
    let pipeHandleInt = ctypes.cast(this.pipeHandle, ctypes.intptr_t);

    // break if pipe handle is valid
    if (ctypes.Int64.compare(pipeHandleInt.value, ctypes.Int64(ostypes.CONST.INVALID_HANDLE_VALUE)) != 0) {
      console.log('connected via ' + this.pipeHandle + '!')
      result = true;
      setTimeout(function() {
        callback();
      },0);
    }
    else {
      console.log('Unable to connect - waiting for next attempt.');
      var _this = this;
      var id = setTimeout(function() {
        _this.connect(callback);
      }, 5000);
    }
    return result;
  },
  readCallback: function(errorCodes, numberOfBytesTransfered, pOverlapped) {
    self.postMessage("  numberOfBytesTransfered " + numberOfBytesTransfered);

    console.log("readCallback:")
    console.log("  errorCodes " + errorCodes);
    console.log("  numberOfBytesTransfered " + numberOfBytesTransfered);
    console.log("  pOverlapped " + pOverlapped);

    // get the data etc.

    return undefined;
  },

  readAsync: function() {
    var MAXLEN = 1024;

    let bytesRead = ctypes.uint32_t(0);
    let pBufferType = ctypes.char.array(MAXLEN);
    let pBuffer = pBufferType();

    self.postMessage('here we go');
    console.log("starting readFileEx");
    ostypes.API('ReadFileEx')(
      this.pipeHandle,
      pBuffer,
      MAXLEN,
      this.overlapped.address(),
      this.cReadCallback);
    console.log("ending readFileEx");
  },
  send: function(msg) {
    let bytesWritten = ctypes.uint32_t(0);
    // we should send bytes instead of this clean it up
    let result = writeFile(this.pipeHandle, msg, msg.length, bytesWritten.address(), null);
  },
  sendAsync: function(msg) {
    var _this = this;
    setTimeout(function() { _this.send(msg); }, 0);
  }
}
