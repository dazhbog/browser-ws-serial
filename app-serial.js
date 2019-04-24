/* MG 2019 - MIT */

/*
Browser sends
    cmd-serial-list
    cmd-serial-open
    cmd-serial-close
    cmd-serial-write

Browser receives / subscribes to
    serial-list
    serial-open
    serial-close
    serial-data

*/
var serialport = require("serialport");
var io         = require('socket.io')();
var dataBuffer = null;
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
