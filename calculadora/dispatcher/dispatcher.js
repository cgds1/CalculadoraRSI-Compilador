
const net = require('net');

const DIRECCION_BO = { ip: '127.0.0.1', puerto: 5001 };
const PORT_DISPATCHER = 8080;

const server = net.createServer((socketCliente) => {
    socketCliente.on('data', (data) => {
        const socketBO = net.createConnection({ port: DIRECCION_BO.puerto, host: DIRECCION_BO.ip }, () => {
            socketBO.write(data);
        });

        socketBO.on('data', (respuestaBO) => {
            socketCliente.write(respuestaBO);
            socketBO.end();
        });

        socketBO.on('error', () => {
            socketCliente.write(JSON.stringify({ error: "Back-Office no disponible" }));
        });
    });
});

server.listen(PORT_DISPATCHER, () => console.log(`Dispatcher Proxy corriendo en puerto ${PORT_DISPATCHER}`));