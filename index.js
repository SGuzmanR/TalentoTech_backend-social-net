// Importar dependencias (Configurar en package.json)
import express from "express";
import dotenv from "dotenv";
import connection from "./database/connection.js";
import bodyParser from "body-parser";

import UserRoutes from "./routes/users.js";
import PublicationRoutes from "./routes/publications.js";
import FollowRoutes from "./routes/follows.js";

// Mensaje de Bienvenida para verificarse ejecuto la API de Node
console.log("API Node en ejecucion");

// Conexion a la Base de Datos
connection();

// Crear el servidor Node
const app = express();
const puerto = process.env.PORT || 3900;

// Configurar CORS para que acepte peticiones del Front-end
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Decodificar los datos desde los formularios para convertirlos en objetos Javascript
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extend: true }));

// Configurar rutas del aplicativo (modulos)
app.use('/api/user', UserRoutes);
app.use('/api/publication', PublicationRoutes);
app.use('/api/follow', FollowRoutes);

// Configurar el servidor de Node
app.listen(puerto, () => {
  console.log("Servidor de Node ejecutandose en el puerto", puerto);
});

export default app;