// Definición del servicio distribuido de la calculadora.
// A partir de este único archivo el compilador DCL genera todos los
// artefactos de la calculadora distribuida (gRPC + Socket JSON).

service CalculadoraService {
    host: "localhost"
    port: 50051
    protocol: both        // grpc | socket | both

    class Calculadora {
        method add(a: float, b: float): float
        method sub(a: float, b: float): float
        method mul(a: float, b: float): float
        method div(a: float, b: float): float
    }
}
