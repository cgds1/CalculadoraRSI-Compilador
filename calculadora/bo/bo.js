// calculadora/bo/bo.js
const net = require('net');

const calculadora = {
    suma(a, b) { return a + b; },
    resta(a, b) { return a - b; },
    multiplicacion(a, b) { return a * b; },
    division(a, b) { return b === 0 ? "Error: División por cero" : a / b; }
};

const PORT_BO = 5001;

net.createServer((socket) => {
    socket.on('data', (data) => {
        try {
            // AQUÍ SE HACE EL PARSE DEL STRING QUE MANDÓ EL CLIENTE
            const peticion = JSON.parse(data.toString());
            
            // Get dinámico
            const metodo = calculadora[peticion.operacion];

            if (typeof metodo === 'function') {
                const resultado = metodo(...peticion.datos);
                socket.write(JSON.stringify({ resultado }));
            } else {
                socket.write(JSON.stringify({ error: "Operación no soportada" }));
            }
        } catch (e) {
            socket.write(JSON.stringify({ error: "Error al parsear o procesar en B.O." }));
        }
    });
}).listen(PORT_BO, () => console.log(`Back-Office corriendo en puerto ${PORT_BO}`));