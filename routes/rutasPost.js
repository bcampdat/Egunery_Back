const express = require("express");
const router = express.Router();
const morgan = require("morgan");
const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

// Configuración de multer para imágenes destacadas
const featuredImageStorage = multer.diskStorage({
  destination: path.join(__dirname, "../MyUploads/featuredImages"),
  filename: (req, file, cb) => {
    const postId = req.body.postId || uuidv4();
    cb(null, `${postId}-${uuidv4().slice(0,12)}${path.extname(file.originalname)}`);
  },
});

const featuredImageUpload = multer({ storage: featuredImageStorage }).single("featured_image");

// Configuración de multer para imágenes del editor
const editorImageStorage = multer.diskStorage({
  destination: path.join(__dirname, "../MyUploads/editorImages"),
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});

const editorImageUpload = multer({ storage: editorImageStorage }).single("image");

// Ruta para subir imágenes desde el editor de texto
router.post("/posts/upload-editor-image", editorImageUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se proporcionó ninguna imagen" });
  }
  const imageUrl = `/MyUploads/editorImages/${req.file.filename}`; // La URL relativa de la imagen subida
  res.status(200).json({ url: imageUrl });
});

// Ruta para obtener todos los posts
router.get("/posts", (req, res) => {
  const q = "SELECT * FROM posts";
  db.query(q, (err, data) => {
    if (err) {
      console.error("Error al obtener posts:", err);
      return res.status(500).json({ message: "Error del servidor" });
    }
    return res.json(data);
  });
});

// Ruta para obtener un post por su ID
router.get("/posts/:id", (req, res) => {
  const postId = req.params.id;
  const q = "SELECT * FROM posts WHERE id = ?";
  db.query(q, [postId], (err, data) => {
    if (err) {
      console.error("Error al obtener el post:", err);
      return res.status(500).json({ message: "Error del servidor" });
    }
    if (data.length === 0) {
      return res.status(404).json({ message: "Post no encontrado" });
    }
    return res.json(data[0]);
  });
});

// Ruta para crear un nuevo post
router.post("/posts/create", morgan("dev"), featuredImageUpload, (req, res) => {
  const { title, content, usuario_id } = req.body;
  const featuredImage = req.file ? `/MyUploads/featuredImages/${req.file.filename}` : null;

  if (!title || !content || !usuario_id) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  const q = "INSERT INTO posts (title, content, featured_image, usuario_id) VALUES (?, ?, ?, ?)";
  db.query(q, [title, content, featuredImage, usuario_id], (err, result) => {
    if (err) {
      console.error("Error al crear el post:", err);
      return res.status(500).json({ message: "Error al crear el post" });
    }

    const postId = result.insertId;
    return res.status(201).json({ message: "Post creado con éxito", postId });
  });
});

router.put("/posts/update/:id", morgan("dev"), featuredImageUpload, (req, res) => {
  const postId = req.params.id;
  const { title, content, usuario_id, remove_image } = req.body; 
  const newFeaturedImage = req.file ? `/MyUploads/featuredImages/${req.file.filename}` : null;

  // Consulta para verificar si el post pertenece al usuario autenticado
  const qSelect = `
    SELECT posts.*, usuarios.id_users 
    FROM posts 
    JOIN usuarios ON posts.usuario_id = usuarios.id_users 
    WHERE posts.id = ? AND usuarios.id_users = ?
  `;

  db.query(qSelect, [postId, usuario_id], (err, result) => {
    if (err) {
      console.error("Error al obtener el post:", err);
      return res.status(500).json({ message: "Error del servidor" });
    }

    if (result.length === 0) {
      return res.status(403).json({ message: "No autorizado para actualizar este post o post no encontrado" });
    }

    const post = result[0];
    const oldImagePath = post.featured_image ? path.join(__dirname, "..", post.featured_image) : null;

    // Caso 1: Eliminar la imagen si se envía la opción de eliminar (remove_image) o si se sube una nueva
    if (remove_image === "true" || newFeaturedImage) {
      if (oldImagePath && fs.existsSync(oldImagePath)) {
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error("Error al eliminar la imagen antigua:", err);
          }
        });
      }
    }

    // Caso 2: Actualización de los datos del post
    const updatedImage = newFeaturedImage ? newFeaturedImage : (remove_image === "true" ? null : post.featured_image);

    const qUpdate = `
      UPDATE posts SET title = ?, content = ?, featured_image = ? WHERE id = ?
    `;
    db.query(qUpdate, [title, content, updatedImage, postId], (err, data) => {
      if (err) {
        console.error("Error al actualizar el post:", err);
        return res.status(500).json({ message: "Error al actualizar el post" });
      }
      return res.json({ message: "Post actualizado con éxito" });
    });
  });
});


// Ruta para eliminar un post existente y su imagen destacada
router.delete("/posts/delete/:id", morgan("dev"), (req, res) => {
  const postId = req.params.id;
  const usuario_id = req.body.usuario_id; // El usuario logueado que quiere eliminar el post

  // Verificar si el usuario es propietario del post
  const qCheckOwnership = "SELECT * FROM posts WHERE id = ? AND usuario_id = ?";
  db.query(qCheckOwnership, [postId, usuario_id], (err, result) => {
    if (err) {
      console.error("Error al verificar el propietario del post:", err);
      return res.status(500).json({ message: "Error del servidor" });
    }

    if (result.length === 0) {
      return res.status(403).json({ message: "No tienes permiso para eliminar este post" });
    }

    // Obtener la imagen destacada y eliminarla si existe
    const imageName = result[0]?.featured_image;
    if (imageName) {
      const imagePath = path.join(__dirname, "../MyUploads/featuredImages", imageName);

      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Error al eliminar la imagen física:", err);
            return res.status(500).json({ message: "Error al eliminar la imagen" });
          }
        });
      }
    }

    // Eliminar el post
    const qDelete = "DELETE FROM posts WHERE id = ?";
    db.query(qDelete, [postId], (err, data) => {
      if (err) {
        console.error("Error al eliminar el post:", err);
        return res.status(500).json({ message: "Error al eliminar el post" });
      }
      return res.json({ message: "Post y su imagen eliminados con éxito" });
    });
  });
});

module.exports = router;
