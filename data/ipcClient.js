var IpcClient = function IpcClient(pipeName, pipeRead, pipeClosed) {
  this.pipeName = pipeName;
  this.pipeRead = pipeRead;
  this.pipeClosed = pipeClosed;

  this.init();
}

var MAXLEN = 1024;

IpcClient.prototype = {
  init: function() {
    this.overlapped = new ostypes.TYPE.OVERLAPPED;

    this.bytesRead = ostypes.TYPE.DWORD(0);
    this.bytesWritten = ostypes.TYPE.DWORD(0);
    var bufferType = ctypes.char.array(MAXLEN);
    this.readBuffer = bufferType();
    this.writeBuffer = bufferType();

    var _this = this;
    var jsReadCallback = function(errorCodes, numberOfBytesTransfered, pOverlapped) {
        _this.readCallback(errorCodes, numberOfBytesTransfered, pOverlapped);
    };

    this.cReadCallback = ostypes.TYPE.LPOVERLAPPED_COMPLETION_ROUTINE(jsReadCallback);
    console.log("cReadCallback: " + this.cReadCallback);
  },
  connect: function(callback) {
    var result = false;

    if (typeof this.pipeHandle != 'undefined' && this.pipeHandle != ctypes.voidptr_t(0)) {
      ostypes.API('CloseHandle')(this.pipeHandle);
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

    console.log("readCallback:")
    console.log("  errorCodes " + errorCodes);
    console.log("  numberOfBytesTransfered " + numberOfBytesTransfered);
    console.log("  pOverlapped " + pOverlapped);

    // get the data etc.
    self.postMessage("  numberOfBytesTransfered " + numberOfBytesTransfered);
    if (numberOfBytesTransfered > 0) {
        try {
            this.pipeRead(this.readBuffer, numberOfBytesTransfered);
        } catch (e) {
            self.postMessage(e.toString());
        }
    } else {
        this.pipeClosed();
    }

//    if (numberOfBytesTransfered > 0) {
//        this.readAsync();
//    }

    return undefined;
  },

  readAsync: function() {
    self.postMessage('calling readAsync');
    ostypes.API('ReadFileEx')(
      this.pipeHandle,
      this.readBuffer,
      MAXLEN,
      this.overlapped.address(),
      this.cReadCallback);
    ostypes.API('SleepEx')(             // how do we interrupt this? :P
        60000,
        true
    );
  },
  send: function(msg) {
      self.postMessage('calling write');
      ostypes.API('WriteFile')(
          this.pipeHandle,
          ctypes.char.array()((msg)),
          msg.length,
          this.bytesWritten.address(),
          null);
  }
}
