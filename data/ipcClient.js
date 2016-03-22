var IpcClient = function IpcClient(pipeName, pipeRead, pipeClosed) {
  this.pipeName = pipeName;
  this.pipeRead = pipeRead;
  this.pipeClosed = pipeClosed;

  this.init();
}

var MAXLEN = 1024;
var SLEEPEXPERIOD = 1000;
var PIPECHECKPERIOD = 1000;

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
        }, PIPECHECKPERIOD);
    }
    return result;
  },
  readCallback: function(errorCodes, numberOfBytesTransfered, pOverlapped) {
    self.postMessage("received " + numberOfBytesTransfered + " bytes");
    self.postMessage("errorCodes " + errorCodes);
    var _this = this;
    if (numberOfBytesTransfered > 0) {
        setTimeout(function() {
            _this.readAsync()
        }, 0);
        try {
            _this.pipeRead(_this.readBuffer, numberOfBytesTransfered);
        } catch (e) {
            self.postMessage(e.toString());
        }
    } else {
        // check if we canceled, if not we closed
        if (errorCodes == ostypes.CONST.ERROR_BROKEN_PIPE) {
            self.postMessage('ERROR_BROKEN_PIPE');
            setTimeout(function() {
                _this.pipeClosed();
            }, 0)
        } else if (errorCodes == ostypes.CONST.ERROR_OPERATION_ABORTED) {
            self.postMessage('ERROR_OPERATION_ABORTED');
            // setTimeout(function() {
            //     _this.readAsync()
            // }, 0);
        }
    }

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


    var res = null;
    do {
//        self.postMessage('sleepEx (' + SLEEPEXPERIOD + ' msec)');
        var res = ostypes.API('WaitForSingleObjectEx')(
            this.pipeHandle,
            SLEEPEXPERIOD,
            true
        );
    } while (res != ostypes.CONST.WAIT_IO_COMPLETION);
  },
  send: function(msg) {         // TODO: Consider SendAsync
      self.postMessage("sending '" + msg + "'");
      ostypes.API('WriteFile')(
          this.pipeHandle,
          ctypes.char.array()(msg),
          msg.length,
          this.bytesWritten.address(),
          null);
  }
}
