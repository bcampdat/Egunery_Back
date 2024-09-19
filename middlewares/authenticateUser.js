// middlewares/authenticateUser.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    // Verifica el token con la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Busca al usuario en la base de datos usando el ID obtenido del token decodificado
    const [userResult] = await db.promise().query('SELECT * FROM users WHERE id = ?', [decoded.userId]);

    if (userResult.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // Establece el usuario autenticado en el contexto de la solicitud
    req.context = { loginUser: userResult[0] };

    next(); // Continúa a la siguiente función de middleware o controlador de ruta
  } catch (error) {
    console.error('Error de autenticación:', error);
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = authenticateUser;
