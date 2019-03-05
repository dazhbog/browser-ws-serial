/* MG 2019 */
var serialport = require("serialport");
//var SerialPort = serialport.SerialPort; // localize object constructor
var io         = require('socket.io')();
var dataBuffer =null;
process.on('uncaughtException', function (error) {
    console.log(error.stack);
});

var serial;

io.on('connection', function(socket){
    console.log('WS client connected');
    serial = {};
    socket.on('cmd-serial-list', function(cmd){
        if ((serial.isOpen)&&(serial.isOpen()))
            return;
        serialport.list(function (err, ports) {
            if ((!err)&&(ports))
                io.emit('serial-list', ports);
            else
                io.emit('serial-error', err);
        });
    });

    socket.on('cmd-serial-close', function(portInfo){
        if ((serial.isOpen)&&(serial.isOpen())){
            serial.close();
            console.log('Closing', portInfo.comName);
        } else {

        }
    });

    socket.on('cmd-serial-write', function(data){
        if ((serial.isOpen)&&(serial.isOpen())){
            serial.write(data);
            //console.log("<<<",new Buffer(data))
            
        }else{
            console.log("port not open, cannot write");
        }
    });

    socket.on('error', function(err){
        console.log('WS err',err);
    });

    socket.on('disconnect', function(){
        console.log('WS client disc');
        if ((serial.isOpen)&&(serial.isOpen())){
            serial.close();
            console.log('Socket conn lost. Closing');
        }
    });



        socket.on('cmd-serial-open', function(portInfo){
                        //if (serial.ports[comname].open)
                        
                        /*if (serial){
                            return;
                        }*/
                        console.log("Opening", portInfo.comName, portInfo.options.baudrate);
                        serial = new serialport(portInfo.comName, portInfo.options);
                        
                            serial.on('open', function(){
                                console.log("Opened", portInfo.comName, portInfo.options.baudrate);
                                io.emit('serial-open', {});
                                //serial.open = 1;
                            });

                            

                            serial.on('error', function(err){
                                console.log("Error",  err);
                                io.emit('serial-error', err);
                                //serial.close();
                                //serial.open = 0;
                            });
                            
                            
                            serial.on('data', function(data){
                                if (serial.H)
                                    clearTimeout(serial.H)
                 
                                //appendBuffer(data);

                                //console.log("1>",dataBuffer)
                                //console.log("2>",data)

                                if (dataBuffer)
                                    dataBuffer = new Buffer.concat([dataBuffer, data]);
                                else
                                    dataBuffer = new Buffer(data);

                                console.log(">>>",dataBuffer);
                                serial.flush(function(err,results){
                                    serial.H = setTimeout(function(){
                                      //var out= "";
                                      //out = sp.data.toString().replace(  /\~\[/g,  timestamp()+"~[" );
                                      //process.stdout.write(out.toString());
                                      //sp.data="";
                                      
                                      io.emit('serial-data', dataBuffer);
                                      dataBuffer = null;

                                    }, 150);

                                });
                                //sp.data += data;
                                
                                 
                                
                            });

                            serial.on('close', function(){
                                console.log("Closed", portInfo.comName);
                                io.emit('serial-close', {});
                                //serial.open = 0;
                            });

                            
    });
});
io.listen(8989);











/*
function listports(){
    console.log("Scanning for serial devices..");
    serialport.list(function (err, ports) {
        ports.forEach(function(port) {
             console.log(i+": "+port.comName+",\t "+port.manufacturer+"\t"+port.vendorId);
          	// console.log(i+": "+port.comName+",\t "+port.manufacturer+",\t "+port.pnpId+",\t "+port.productId+",\t "+port.locationId+",\t "+port.serialNumber+",\t "+port.vendorId);
            // if (port.manufacturer.search("Texas")!=-1)
            i++;
        });
        //process.exit(1);
    });
}

function openportID(id){
    serialport.list(function (err, ports) {
        for (var i = 0; i < ports.length; i++) {
          if (i==id){
            console.log(timestamp()+"["+id+"] Opening "+ports[i].comName+",\t "+ports[i].manufacturer);
            open(id, ports[i].comName, baud);
          }
        }
    });
}

function open(id, port, baud){
  var n = id+"";
  sp = new SerialPort( port , {
    baudrate: parseInt(baud),
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    //parser: serialport.parsers.readline("\n"),
    flowControl: false
});

sp.on("close", function (err) {
    console.log(timestamp()+"["+n+"] "+"port closed, reopening..");
    setTimeout(function(){ open(id, port, baud); },1000);
    serial_ok=0;
});

sp.on("error", function (err) {
  //console.error(timestamp.is()+"[MG]", err);
 // console.log(timestamp()+"["+n+"] "+err);
  setTimeout(function(){ open(id, port, baud); },5000);
  serial_ok=0;
});

sp.on("open", function () {
  console.log(timestamp()+"["+n+"] "+"port opened @"+baud);
  serial_ok=1;
});

sp.on('data', function(data) {
  if (sp.H)
    clearTimeout(sp.H)
  if (!sp.data)
     sp.data = "";

   sp.data += data;
  setTimeout(function(){
      var out= "";
      //out = sp.data.toString().replace(/\n/g,"");
      //out = sp.data.toString().replace(/\r/g,"");
      out = sp.data.toString().replace(  /\~\[/g,  timestamp()+"~[" );
      process.stdout.write(out.toString());
      sp.data="";
  }, 50)
  
  
});
}



function chomp(input){
    out = "";
    for(var i=0;i<input.length;i++){
        if ((input[i]>= 32)&&(input[i] <= 126)){
            out+= ""+String.fromCharCode(input[i])+"";
            //out+= "<"+input[i].toString(16)+">";
        }else{
            out+= input[i].toString(16);
        }
    }
    return out;
};

function date_str(){
  var d =  new Date();
  return d.getDate()+"-"+(d.getMonth()+1)+"-"+d.getFullYear();
}

//var last_timestamp;
function timestamp() {
  var currentdate = new Date();
  //var millis = (currentdate.getTime() - last_timestamp);
  var res = "["+date_str()+"]["+padd(2,currentdate.getHours()) + ":"+ padd(2,currentdate.getMinutes()) + ":"+ padd(2,currentdate.getSeconds())+"]";
  //last_timestamp = currentdate.getTime();
  return res;
}
function padd(decimal_places,value){   //to be properly coded
  if ((value<1000)&& (decimal_places>3)){ value="0"+value; }
  if ((value<100) && (decimal_places>2)){ value="0"+value; }
  if ((value<10)  && (decimal_places>1)){ value="0"+value; }
  return value;

}*/
