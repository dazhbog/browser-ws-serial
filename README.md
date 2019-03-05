# browser-ws-serial

A Node.JS bridge that allows the browser to access serial ports over websockets. Uses serialport and socket.io

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. 



### Installing

A step by step series of examples that tell you how to get a development env running


```
Download or Clone repository
cd browser-ws serial
npm install
```

And 

```
node app-serial.js
```

The server is now running.


### Usage

Browser emits - Node.JS receives / subscribes to
```
    cmd-serial-list
    cmd-serial-open
    cmd-serial-close
    cmd-serial-write

    Built-in, on both sides
    error
    disconnect
```

Browser receives / subscribes to - Node.JS emits
```
    serial-list
    serial-open
    serial-close
    serial-data
    serial-error

    Built-in, on both sides
    error
    disconnect
```

Examples coming soon.

## License

This project is licensed under the MIT License

