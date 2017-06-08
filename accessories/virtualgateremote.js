//Version 2017_0123.0
var Service, Characteristic, communicationError;
var http = require('http');

module.exports = function (oService, oCharacteristic, oCommunicationError) {
  Service = oService;
  Characteristic = oCharacteristic;
  communicationError = oCommunicationError;

  return VeraVirtualGateRemote;
};
module.exports.VeraVirtualGateRemote = VeraVirtualGateRemote;

function VeraVirtualGateRemote(log, data, client) {
  // device info
  this.domain = "switch"
  this.data = data
  this.id = data.id
  this.name = data.name
  this.category = data.category
  this.client = client
  this.log = log;
}

VeraVirtualGateRemote.prototype = {
  identify: function(callback){
    this.log("-------------------------------------------------------------");
		this.log("Identified: " + this.id + " as " + this.name);
		this.log("-------------------------------------------------------------");
    callback(null)
  },
  getGateState: function(callback){
		this.log("Get GateState: " + this.name + "(" + this.id + ") Category: " + this.category);
    this.client.queryDevice(this.id, 'gatetoggle', function(data){
      //TODO: data not reported correctly
      if ((data == '0') || (data == '1')) {
        callback(null, data)
      }
      else{
        callback(communicationError)
      }
    }.bind(this))
  },
  setToggle: function(powerOn, callback) {
    //var that = this;
    powerOn = true;
    if (powerOn) {
  		this.log("Toggle: " + this.name + "(" + this.id + ")");
      this.client.setDevice(this.id, 'gatetoggle', 100 ,function(data){
        if (data) {
          this.log(data)
          this.log("Successfully toggled '"+this.name+"'");
          callback()
        }else{
          callback(communicationError)
        }
      }.bind(this))
    }else{
  		this.log("Set PowerState: " + this.name + "(" + this.id + "): OFF");
      this.client.setDevice(this.id, 'turnOff', 0, function(data){
        if (data) {
          this.log("Successfully set power state on the '"+this.name+"' to off");
          callback()
        }else{
          callback(communicationError)
        }
      }.bind(this))
    }
  },
  getServices: function() {
    var switchService = new Service.Switch();
    var informationService = new Service.AccessoryInformation();

    informationService
      .setCharacteristic(Characteristic.Manufacturer, "Vera Device")
      .setCharacteristic(Characteristic.Model, "Switch")
      .setCharacteristic(Characteristic.SerialNumber, "xxx");

    switchService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getGateState.bind(this))
      .on('set', this.setToggle.bind(this));

      //Lets define a port we want to listen to
      const PORT=9000 + this.id;
      console.log(PORT);
      //We need a function which handles requests and send response
      function handleRequest(request, response){
          response.end('It Works!! Path Hit: ' + request.url);
          console.log('Server request received: ' + PORT);
          switchService.getCharacteristic(Characteristic.On).getValue();
      }
      //Create a server
      var server = http.createServer(handleRequest);
      //Lets start our server
      server.listen(PORT, function(){
          //Callback triggered when server is successfully listening. Hurray!
          console.log("Server listening on: http://localhost:%s", PORT);
      });

    return [informationService, switchService];
  }

}
