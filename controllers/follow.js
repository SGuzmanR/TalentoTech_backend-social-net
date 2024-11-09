import User from '../models/users.js';
import Follow from '../models/follows.js';
import { ensureAuth } from '../middleware/auth.js';

export const testFollow = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controlador de Follow",
  });
};

// Metodo para guardar un follo (Seguir a otro usuario)
export const saveFollow = async (req, res) => {
  try {
    // Obtener datos desde el body
    const { followed_user } = req.body;

    // Obtener el ID del usuario autenticado
    const identity = req.user;
    console.log(identity);
    console.log(identity.userId);

    // Verificar si identity contiene al usuario autenticado
    if (!identity || !identity.userId) {
      return res.status(400).send({
        status: "error",
        message: "No se ha proporcionado el usuario para realizar el following"
      });
    };

    // Verificar si el usuario se esta intentando seguir a si mismo
    if (identity.userId === followed_user) {
      return res.status(400).send({
        status: "error",
        message: "No puedes seguirte a ti mismo"
      });
    };

    // Verificar si usuario a seguir existe
    const followedUser = await User.findById(followed_user);

    if (!followedUser) {
      return res.status(404).send({
        status: "error",
        message: "El usuario que intentas seguir no existe"
      });
    };

    // Verificar si ya existe un seguimiento con los mismos usuarios
    const existingFollow = await Follow.findOne({
      following_user: identity.userId,
      followed_user: followed_user
    });

    if (existingFollow) {
      return res.status(400).send({
        status: "error",
        message: "Ya estas siguiendo a este usuario"
      });
    };

    // Crear el objeto con el modelo follow
    const newFollow = new Follow({
      following_user: identity.userId,
      followed_user: followed_user
    });

    // Guardar el objeto en la BD
    const followStored = await newFollow.save();

    // Verificar si se guardo correctamente en la BD
    if (!followStored) {
      return res.status(500).send({
        status: "error",
        message: "No se ha podido seguir al usuario"
      });
    };

    // Obtener el nombre y apellido del usuario seguido
    const followedUserDetails = await User.findById(followed_user).select('name last_name');

    if (!followedUserDetails) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado"
      });
    };

    // Combinar datos del follow y followedUser
    const combinedFollowData = {
      ... followStored.toObject(),
      followedUser: {
        name: followedUserDetails.name,
        last_name: followedUserDetails.last_name
      }
    };

    // Devolver respuesta
    return res.status(200).json({
      status: "success",
      identity: req.user,
      follow: combinedFollowData
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).send({
        status: "error",
        message: "Ya estas siguiendo a este usuario"
      });
    };

    return res.status(500).send({
      status: "error",
      message: "Error al seguir al usuario"
    });
  };
};