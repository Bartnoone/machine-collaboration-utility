/*******************************************************************************
 * FakeMarlinConnection.js
 *
 * A class to manage opening, maintaining, and closing a serial connection.
 * This class wraps a serialport connection and mostly cleanly handles the data
 * stream following open so that we settle into a clean state to match commands
 * with responses.
 ******************************************************************************/
const _ = require('underscore');
const Promise = require(`bluebird`);
let logger;

/**
 * VirtualConnection()
 *
 * Simulates responses generated by Marlin Firmware
 *
 * User defined callbacks can be set for processing data, close and error
 *
 * Args:   inComName       - name of our com port
 *         inBaud          - baud rate
 *         inOpenPrimeStr  - string of commands to prime the connection
 *         inInitDataFunc  - passed opening sequence data (inInitDataFunc(inData))
 *         inConnectedFunc - function to call when we have successfully
 *                           connected
 * Return: N/A
 */
var VirtualConnection = function(app, connectedFunc) {
  this.app = app;
  this.logger = app.context.logger;
  this.mCloseFunc = undefined;
  this.mErrorFunc = undefined;
  this.mDataFunc = connectedFunc;

  this.nBufferedCommands = 0;
  this.bufferSize = 32;

  connectedFunc(this);
};


/*******************************************************************************
 * Public interface
 *******************************************************************************/

/**
 * setDataFunc(), setCloseFunc, setErrorFunc()
 *
 * Set the user configurable functions to call when we receive data,
 * close the port or have an error on the port.
 */
VirtualConnection.prototype.setDataFunc = function (inDataFunc) {
  this.mDataFunc = inDataFunc;
};
VirtualConnection.prototype.setCloseFunc = function (inCloseFunc) {
  this.mCloseFunc = inCloseFunc;
};
VirtualConnection.prototype.setErrorFunc = function (inErrorFunc) {
  this.mErrorFunc = inErrorFunc;
};

/**
 * send()
 *
 * Send a command to the device
 *
 * Args:   inCommandStr - string to send
 * Return: N/A
 */
VirtualConnection.prototype.send = async function (inCommandStr) {
  if (_.isFunction(this.mDataFunc)) {
    const commandPrefix = inCommandStr.split(` `).shift();
    let reply = `ok`;
    if (this.nBufferedCommands >= this.bufferSize) {
      await this.waitForBufferToClear();
    }
    this.nBufferedCommands++;
    switch (commandPrefix) {
      case 'G4':
        if (inCommandStr.indexOf(`G4 P`) !== -1) {
          await Promise.delay(parseInt(inCommandStr.split(`G4 P`).pop().split(`\n`).shift(), 10));
        }
        reply = `ok`;
        break;
      case 'G1':
        await Promise.delay(5);
        reply = `ok`;
        break;
      default:
        this.logger.error(`command not supported`);
    }
    this.nBufferedCommands--;
    this.mDataFunc(reply);
    // this.app.io.emit('botReply', reply);
  }
};

/**
 * close()
 *
 * Close our connection
 *
 * Args:   N/A
 * Return: N/A
 */
VirtualConnection.prototype.close = function () {
  if (_.isFunction(this.mCloseFunc)) {
    this.mCloseFunc();
  }
};

VirtualConnection.prototype.waitForBufferToClear = async function () {
  await Promise.delay(100);
  if (this.nBufferedCommands >= this.bufferSize) {
    await this.waitForBufferToClear();
  }
};

module.exports = VirtualConnection;
