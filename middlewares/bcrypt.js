const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Función para encriptar la contraseña
const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

// Función para comparar contraseñas
const comparePasswords = async (password, hashedPassword) => {
  const isValid = await bcrypt.compare(password, hashedPassword);
  return isValid;
};

// Función para generar un token JWT
const generateToken = (user) => {
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return token;
};



module.exports = { encryptPassword, comparePasswords, generateToken};
