/* MG 2019 - MIT */

/*
Browser sends
    cmd-serial-list
    cmd-serial-open
    cmd-serial-close
    cmd-serial-write
    exec nrfjprog.exe
    exec nrfjprog -f nrf52 etc

Browser receives / subscribes to
    serial-list
    serial-open
    serial-close
    serial-data

*/
var net = require('net'); // server for oled 
var serialport = require("serialport");
var io         = require('socket.io')();
var dataBuffer = null;
var log = console.log;

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

    socket.on('pulse-terminal-cmd', function(terminalData){
            
            if (term_bridge_socket){
                term_bridge_socket.write(terminalData+"");
                console.log('Terminal inject:', terminalData, " [OK]");
            } else {
                console.log('Terminal inject:', terminalData, " [NOP]");
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
        console.log("Opening", portInfo.comName, portInfo.options.baudrate);
        serial = new serialport(portInfo.comName, portInfo.options);
        
            serial.on('open', function(){
                console.log("Opened", portInfo.comName, portInfo.options.baudrate);
                io.emit('serial-open', {});
            });

            serial.on('error', function(err){
                console.log("Error",  err);
                io.emit('serial-error', err);
            });
            
            
            serial.on('data', function(data){
                if (serial.H)
                    clearTimeout(serial.H);
                if (dataBuffer)
                    dataBuffer = new Buffer.concat([dataBuffer, data]);
                else
                    dataBuffer = new Buffer(data);

                console.log(">>>",dataBuffer);
                serial.flush(function(err,results){
                    serial.H = setTimeout(function(){
                      io.emit('serial-data', dataBuffer);
                      dataBuffer = null;

                    }, 100);

                });
            });

            serial.on('close', function(){
                console.log("Closed", portInfo.comName);
                io.emit('serial-close', {});
            });         
    });
});
io.listen(8989);
log("Serial")
log("Socket.io listening on ",8989)
startOledBridge();
startTermBridge();

var IDLE_TIME = 100000;
var dataBuffer =null;
var counter=0;
function startOledBridge(){
        var oled_bridge_port = 4554;
        net.createServer(function (s) {
                    
                    log("Oled client connected.. waiting for data..")

                    s.setTimeout(IDLE_TIME, function(){   //idle timeout
                         s.end(); //best close?
                    });

                    s.on('data', function (data) {
                            log(">>[",counter++,"][",data.length,"]\n", data);
                            if (io){
                                io.emit('oled-data', new Buffer(data));
                            }       
                    });

                    s.on('close', function () {
                          
                    });

                    s.on('error', function () {
                      
                    });

        }).listen(oled_bridge_port);
        log("Oled bridge listening on ",oled_bridge_port)

}

var term_bridge_socket = null;
function startTermBridge(){
        var term_bridge_port = 4555;
        net.createServer(function (s) {
                    
                    log("Terminal client connected.. ")
                    s.active = 1;
                    term_bridge_socket = s;
                    s.setTimeout(IDLE_TIME, function(){   //idle timeout
                         s.end(); //best close?
                    });

                    s.on('data', function (data) {
                               
                    });

                    s.on('close', function () {
                          term_bridge_socket = null;
                    });

                    s.on('error', function () {
                      
                    });

        }).listen(term_bridge_port);
        log("Terminal bridge listening on ",term_bridge_port)

}