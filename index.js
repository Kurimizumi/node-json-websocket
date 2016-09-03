'use strict';

const JsonWebSocket = function(socket) {
  this._socket = socket;
  this._closed = false;
  socket.on('close', this._onClose.bind(this));
  socket.on('text', this._onMessage.bind(this));
  socket.on('error', this._onError.bind(this));
};

module.exports = JsonWebSocket;

JsonWebSocket.prototype = {
  _onMessage: function(str) {
    let message;
    try {
      message = JSON.parse(str);
    } catch (e) {
      let err = new Error('Could not parse JSON: ' + e.message +
        '\nRequest data: ' + str);
      err.code = 'E_INVALID_JSON';
      throw err;
    }
    message = message || {};
    this._socket.emit('message', message);
  },

  sendError: function(err) {
    this.sendMessage(this._formatError(err));
  },
  sendEndError: function(err) {
    this.sendMessage(this._formatError(err));
  },
  _formatError: function(err) {
    return {success: false, error: err.toString()};
  },

  destroy: function() {
    this._onClose();
    this._socket.close();
  },

  setTimeout: function(timeout, callback) {
    this._socket.socket.setTimeout(timeout, callback);
  },

  sendMessage: function(message, callback) {
    if(this._closed) {
      if(callback) {
        callback(new Error('The socket is closed'));
      }
      return;
    }
    this._socket.send(this._formatMessageData(message), callback);
  },
  sendEndMessage: function(message, callback) {
    let that = this;
    this.sendMessage(message, function(err) {
      that.end();
      if(callback) {
        if(err) {
          return callback(err);
        }
        callback();
      }
    });
  },
  _formatMessageData: function(message) {
    return JSON.stringify(message);
  },

  _onClose: function() {
    this._closed = true;
  },
  _onError: function() {
    this._closed = true;
  },
  isClosed: function() {
    return this._closed;
  }
};

const delegates = [
  'on',
  'once'
];
delegates.forEach(function(method) {
  JsonSocket.prototype[method] = function() {
    this._socket[method].apply(this._socket, arguments);
    return this;
  }
});
