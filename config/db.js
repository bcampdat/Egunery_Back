const mysql = require("mysql2"); 

require("dotenv").config({ path: "./.env" });

// Configurar la conexión a la base de datos
const db =  mysql.createConnection({
  user: process.env.DB_USER || "root",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "mycap_stone",
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err);
    process.exit(1); 
  } else {
    console.log("Conectado a la base de datos MySQL");
  }
});

module.exports = db;
