//Version: 2016_0616.1
var Service, Characteristic, communicationError;
var http = require('http');

module.exports = function (oService, oCharacteristic, oCommunicationError) {
  Service = oService;
  Characteristic = oCharacteristic;
  communicationError = oCommunicationError;
  return VeraDimLight;
};

module.exports.VeraDimLight = VeraDimLight;

function VeraDimLight(log, data, client) {
  // device info
  this.domain = "light"
  this.data = data
  this.id = data.id
  this.name = data.name
  this.category = data.category
  this.client = client
  this.log = log;
}

VeraDimLight.prototype = {
  identify: function(callback){
    this.log("-------------------------------------------------------------");
		this.log("Identified " + this.name + " as VeraID: " + this.id);
		this.log("-------------------------------------------------------------");
    callback(null)
  },
  getPowerState: function(callback){
		this.log("Get PowerState: " + this.name + "(" + this.id + ") Category: " + this.category);

    this.client.queryDevice(this.id, 'onoff', function(data){
      //TODO: data not reported correctly
      if ((data == '0') || (data == '1')) {
        callback(null, data)
      }else{
        this.log.error(communicationError)
        callback(communicationError)
      }
    }.bind(this))

    //this.getBrightness();
  },
  getBrightness: function(callback){
    this.log("Get Brightness: " + this.name + "(" + this.id + ") Category: " + this.category);

    this.client.queryDevice(this.id, 'dim', function(data){
      if (data != null) {
        this.data.level = data
        this.log("get level: " + this.data.level + " of " + this.name);
        callback(null, data)

      }else{
        callback(communicationError)
      }
    }.bind(this))
  },
  setPowerState: function(powerOn, callback) {
    //var that = this;
    //First determine if lights are on

      //this.log("Power state -> Set level: " + this.data.level);
      this.log(this.data);
      var level = 100;//this.data.level;
      var status = this.data.status;
      //callback();

      if ((powerOn) && (status == 0)){
        //this.client.setDevice(this.id, 'turnOn', 100 ,function(data){
        this.client.setDevice(this.id, 'brightness',level , function(data){
          if (data) {
            this.log("Successfully set power state on the '"+this.name+"' to on");
            this.data.level = level;
            this.data.status = 1;
            callback()
          }else{
            callback(communicationError)
          }
       }.bind(this))
     }else if (!powerOn){
      // this.data.level = 0;
      this.log("Set PowerState: " + this.name + "(" + this.id + "): OFF");
       this.client.setDevice(this.id, 'turnOff', 0, function(data){
         if (data) {
           this.log("Successfully set power state on the '"+this.name+"' to off");
           this.data.status = 0;
           callback()
         }else{
           callback(communicationError)
         }
       }.bind(this))
     }else{
       callback();
     }


    /*if (powerOn){
      var brightnessCheck = 100;
      //this.client.queryDevice(this.id, 'dim', function(data){
        //if (data != null) {
          //brightnessCheck = data;
          this.log(lightbulbService.getCharacteristic(Characteristic.On).getValue());


          if (brightnessCheck != 0) {
            this.log("Set PowerState: " + this.name + "(" + this.id + "): ON");
            this.client.setDevice(this.id, 'turnOn', 100 ,function(data){
              if (data) {
                this.log("Successfully set power state on the '"+this.name+"' to on");
                callback()
              }else{
                callback(communicationError)
              }
           }.bind(this))
          }
          //callback(null, data)
        }else{
          callback(communicationError)
        }
      }.bind(this))


       //callback()//Use brightness to 100 to turn on
      // //return //Rather use brightness set to do this

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
    }*/
  },
  setBrightness: function(level, callback) {
    var lightbulbService = new Service.Lightbulb();
    this.log("Set Brightness: " + this.name + "(" + this.id + "): " + level);
    this.data.level = level;
    var that = this;

    this.client.setDevice(this.id, 'brightness',level , function(data){
      if (data) {
        that.log("Successfully set brightness on the '"+that.name+"' to " + level);
        //lightbulbService.getCharacteristic(Characteristic.On).setValue('1')
        this.data.level = level;
        callback()
      }else{
        callback(communicationError)
      }
    }.bind(this))
  },
  getServices: function() {
    var lightbulbService = new Service.Lightbulb();
    var informationService = new Service.AccessoryInformation();

    //TODO: Set serial number
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "Vera Device")
      .setCharacteristic(Characteristic.Model, "Light")
      .setCharacteristic(Characteristic.SerialNumber, "Vera Device id: " + this.id);

    lightbulbService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getPowerState.bind(this))
      .on('set', this.setPowerState.bind(this));

    lightbulbService
      .addCharacteristic(Characteristic.Brightness)
      .on('get', this.getBrightness.bind(this))
      .on('set', this.setBrightness.bind(this));

      lightbulbService.getCharacteristic(Characteristic.On).getValue();
      lightbulbService.getCharacteristic(Characteristic.Brightness).getValue();

      //Lets define a port we want to listen to
      const PORT=9000 + this.id;

      console.log(PORT);

      //We need a function which handles requests and send response
      function handleRequest(request, response){
          response.end('It Works!! Path Hit: ' + request.url);
          console.log('Server request received: ' + PORT);
          lightbulbService.getCharacteristic(Characteristic.On).getValue();
          lightbulbService.getCharacteristic(Characteristic.Brightness).getValue();
          //callback();
      }

      //Create a server
      var server = http.createServer(handleRequest);

      //Lets start our server
      server.listen(PORT, function(){
          //Callback triggered when server is successfully listening. Hurray!
          console.log("Server listening on: http://localhost:%s", PORT);

          //cVeraLight.getCharacteristic(Characteristic.On).getValue();
      });

    return [informationService, lightbulbService];
  }

}
