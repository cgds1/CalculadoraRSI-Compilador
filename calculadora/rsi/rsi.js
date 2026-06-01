// calculadora/rsi/rsi.js
const net = require('net');

class RSI {
    constructor(ip, puerto) {
        this.ip = ip;
        this.puerto = puerto;
    }

    // Recibe el string JSON puro directamente
    enviar(payload) {
        return new Promise((resolve, reject) => {
            
            // Conectar y mandar el string crudo que armó el cliente
            const clientSocket = net.createConnection({ port: this.puerto, host: this.ip }, () => {
                clientSocket.write(payload); 
            });

            clientSocket.on('data', (data) => {
                try {
                    const respuesta = JSON.parse(data.toString());
                    resolve(respuesta.resultado !== undefined ? respuesta.resultado : respuesta.error);
                } catch (e) {
                    reject("Error al procesar la respuesta");
                }
                clientSocket.end();
            });

            clientSocket.on('error', (err) => reject(`Fallo de red: ${err.message}`));
        });
    }
}

module.exports = RSI;