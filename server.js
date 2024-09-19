const express = require("express");
const mysql = require("mysql2"); // Aseguramos que mysql2 es el que se usa
const db = require("./config/db");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const https = require("https");
const fs = require("fs");
const path = require("path");

// Leer certificados SSL y archivos de clave
const options = {
  key: fs.readFileSync(path.join(__dirname, "./seg/localhost-key.pem")), 
  cert: fs.readFileSync(path.join(__dirname, "./seg/localhost.pem")),
};

const app = express();

// Sirve imágenes estáticas desde la carpeta MyUploads
app.use('/MyUploads', express.static(path.join(__dirname, 'MyUploads')));

// Logger
const logger = morgan("dev");
app.use(logger);

// CORS
const corsOptions = {
  origin: process.env.URLFRONTEND || 'https://localhost:5173',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  credentials: true,
  proxy: true,
  samesite: 'none',
};
app.use(cors(corsOptions));

app.use(express.json());

// Rutas
const rutasUser = require("./routes/rutasUser"); 
const rutasPosts = require("./routes/rutasPost");
const rutasEventos = require("./routes/rutasEventos");
app.use("/api", rutasUser);
app.use("/api", rutasPosts);
app.use("/api", rutasEventos);

app.get("/", (req, res) => {
  res.send("WELCOME TO THE BASIC EXPRESS APP WITH AN HTTPS SERVER");
});

// Crear servidor HTTPS
const server = https.createServer(options, app);

// Listener para el servidor HTTPS
const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Servidor HTTPS escuchando en el puerto ${port}`);
});
