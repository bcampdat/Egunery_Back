
const express = require("express");
const mysql = require("mysql2");
const db = require("./config/db");
const cors = require("cors");

const nodemon = require("nodemon");
const morgan = require("morgan");
require("dotenv").config();

const https = require("https");

// https server
const fs = require("fs");
const path = require("path");

// Read SSL certificate and key files
const options = {
  key: fs.readFileSync(path.join(__dirname, "./seg/localhost-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "./seg/localhost.pem")),
};

const app = express();
// Sirve las imágenes estáticas desde la carpeta MyUploads
app.use('/MyUploads', express.static(path.join(__dirname, 'MyUploads')));

const logger = morgan("dev");
app.use(logger);

app.get("/", (req, res) => {
  res.send("WELCOME TO THE BASIC EXPRESS APP WITH AN HTTPS SERVER");
});

// openssl genrsa -out localhost-key.pem 2048

// openssl req -new -x509 -sha256 -key localhost-key.pem -out localhost.pem -days 365
// Create HTTPS server
const server = https.createServer(options, app);

const allowedOrigins = process.env.NODE_ENV === 'production' ? ['https://egunery.netlify.app'] : ['http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  credentials: true,
};

app.use(cors(corsOptions));


app.use(express.json());

// rutas

const rutasUser = require("./routes/rutasUser"); // Importa tu archivo de rutas correctamente
const rutasPosts = require("./routes/rutasPost");
const rutasEventos = require("./routes/rutasEventos");
app.use("/api", rutasUser);
app.use("/api", rutasPosts); // Rutas de posts
app.use("/api", rutasEventos); // Rutas de eventos

app.get("/", (req, res) => {
  return res.json("From Backend Side");
});

// listener
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});