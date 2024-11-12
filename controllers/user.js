import bcrypt from 'bcrypt';
import User from '../models/users.js';
import Follow from '../models/follows.js';
import Publication from '../models/publications.js';
import { createToken } from '../services/jwt.js';
import { followThisUser, followUserIds } from '../services/followServices.js';

// Metodo Registro de Usuarios
export const register = async (req, res) => {
  try {
    // Obtener los datos de la petición
    let params = req.body;

    // Validar los datos obtenidos (que los datos obligatorios existan)
    if(!params.name || !params.last_name || !params.nick || !params.email || !params.password) {
      return res.status(400).json({
        status: "error",
        message: "Faltan datos por enviar"
      });
    };

    // Crear el objeto del usuario con los datos que validamos
    let user_to_save = new User(params);

    // Control de usuarios duplicados
    const existingUser = await User.findOne({
      $or: [
        { email: user_to_save.email.toLowerCase() },
        { nick: user_to_save.nick.toLowerCase() }
      ]
    });

    // Validar el existingUser
    if (existingUser) {
      return res.status(409).send({
        status: "error",
        message: "¡El usuario ya existe en la BD!"
      });
    };

    // Cifrar la contraseña
    // Genera los saltos para encriptar
    const salt = await bcrypt.genSalt(10);

    // Encriptar la contraseña y guardarla en hashedPassword
    const hashedPassword = await bcrypt.hash(user_to_save.password, salt);

    // Asignar la contraseña encriptada al objeto del usauario
    user_to_save.password = hashedPassword;

    // Guardar el usuario en la base de datos
    await user_to_save.save();

    // Devolver el usuario registrado
    return res.status(201).json({
      status: "created",
      message: "Registro de usuario exitoso",
      user_to_save
    });
  } catch (error) {
    console.log("Error en el registro de usuario: ", error);
    // Devolver mensaje de error
    return res.status(500).send({
      status: "error",
      message: "Error en el registro de usuario"
    });
  };
};


// Metodo de Login (usar JWT)
export const login = async (req, res) => {
  try {
    // Obtener los parámetros del body (enviados en la petición)
    let params = req.body;

    // Validar que si recibimos el email y el password
    if (!params.email || !params.password) {
      return res.status(400).send({
        status: "error",
        message: "Faltan datos por enviar"
      });
    };

    // Buscar en la BD si existe el email registrado
    const userBD = await User.findOne({ email: params.email.toLowerCase() });

    // Si no existe el usuario buscado
    if (!userBD) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado"
      });
    }

    // Comprobar su contraseña
    const validPassword = await bcrypt.compare(params.password, userBD.password);

    // Si la contraseña es incorrecta (false)
    if (!validPassword) {
      return res.status(401).send({
        status: "error",
        message: "Contraseña incorrecta"
      });
    }

    // Generar token de autenticación (JWT)
    const token = createToken(userBD);

    // Devolver respuesta de login exitoso
    return res.status(200).json({
      status: "success",
      message: "Autenticación exitosa",
      token,
      userBD: {
        id: userBD._id,
        name: userBD.name,
        last_name: userBD.last_name,
        email: userBD.email,
        nick: userBD.nick,
        image: userBD.image
      }
    });
  } catch (error) {
    console.log("Error en la autenticación del usuario: ", error);
    // Devolver mensaje de error
    return res.status(500).send({
      status: "error",
      message: "Error en la autenticación del usuario"
    });
  };
};

// Metodo para mostrar el perfil de un usuario
export const profile = async (req, res) => {
  try {
    // Obtener el ID del usuario desde los párametros de la URL
    const userId = req.params.id;

    // Verificar si el ID del usuario autenticado está disponible
    if(!req.user || !req.user.userId){
      return res.status(401).send({
        status: "success",
        message: "Usuario no autenticado"
      });
    };

    // Buscar el usuario en la BD y excluimos los datos que no queremos mostrar
    const userProfile = await User.findById(userId).select('-password -role -email -__v');

    // Verificar si el usuario buscado no existe
    if(!userProfile){
      return res.status(404).send({
        status: "success",
        message: "Usuario no encontrado"
      });
    }

    // Información de seguimiento: id del usuario identificado (req.user.userId) y el id del usuario del perfil que queremos consultar (userId = req.params.id)
    const followInfo = await followThisUser(req.user.userId, userId);

    // Devolver la información del perfil del usuario solicitado
    return res.status(200).json({
      status: "success",
      user: userProfile,
      followInfo
    });
  } catch (error) {
    console.log("Error al obtener el perfil del usuario: ", error);
    return res.status(500).send({
      status: "error",
      message: "Error al obtener el perfil del usuario"
    });
  };
};

// Metodo para Listar los usuarios
export const listUsers = async (req, res) => {
  try {
    // Gestionar la paginación
    // 1. Controlar la página actual
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;

    // 2. Configurar los ítems por página a mostrar
    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 4;

    // Realizar consulta paginada
    const options = {
      page: page,
      limit: itemsPerPage,
      select: '-password -email -role -__v'
    };

    const users = await User.paginate({}, options);

    // Si no existen usuarios en la BD disponibles
    if(!users || users.docs.length === 0){
      return res.status(404).send({
        status: "error",
        message: "No existen usuarios disponibles"
      });
    }

    // Listar los seguidores de un usuario, obtener el array de IDs de los usuarios que sigo
    let followUsers = await followUserIds(req);

    // Devolver los usuarios paginados
    return res.status(200).json({
      status: "success",
      users: users.docs,
      totalDocs: users.totalDocs,
      totalPages: users.totalPages,
      CurrentPage: users.page,
      users_following: followUsers.following,
      user_follow_me: followUsers.followers
    });
  } catch (error) {
    console.log("Error al listar los usuarios: ", error);
    return res.status(500).send({
      status: "error",
      message: "Error al listar los usuarios"
    });
  };
};

// Metodo para actualizar los datos del usuario
export const updateUser = async (req, res) => {
  try {
    // Obtener la información del usuario a actualizar
    let userIdentity = req.user;  // el usuario autenticado en el token, lo trae desde el middleware auth.js
    let userToUpdate = req.body;  // recoge los datos nuevos del usuario desde el formulario

    // Eliminar campos que sobran porque no los vamos a actualizar
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;

    // Comprobamos si el usuario ya existe en la BD
    const users = await User.find({
      $or: [
        { email: userToUpdate.email },
        { nick: userToUpdate.nick }
      ]
    }).exec();

    // Verificar si el usuario está duplicado para evitar conflictos
    const isDuplicateUser = users.some(user => {
      return user && user._id.toString() !== userIdentity.userId;
    });

    if(isDuplicateUser) {
      return res.status(400).send({
        status: "error",
        message: "Error, solo se puede actualizar los datos del usuario logueado"
      });
    };

    // Cifrar la contraseña en caso que la envíen en la petición
    if(userToUpdate.password){
      try {
        let pwd = await bcrypt.hash(userToUpdate.password, 10);
        userToUpdate.password = pwd;
      } catch (hashError) {
        return res.status(500).send({
          status: "error",
          message: "Error al cifrar la contraseña"
        });
      };
    } else {
      delete userToUpdate.password;
    };

    // Buscar y actualizar el usuario en Mongo
    let userUpdated = await User.findByIdAndUpdate(userIdentity.userId, userToUpdate, { new: true});

    if(!userUpdated){
      return res.status(400).send({
        status: "error",
        message: "Error al actualizar el usuario"
      });
    };

    // Devolver la respuesta exitosa
    return res.status(200).json({
      status: "success",
      message: "Usuario actualizado correctamente",
      user: userUpdated
    });
  } catch (error) {
    console.log("Error al actualizar los datos del usuario: ", error);
    return res.status(500).send({
      status: "error",
      message: "Error al actualizar los datos del usuario"
    });
  };
};

// Metodo para subir AVATAR (imagen de perfil) y actualizamos el campo image del User
export const uploadAvatar = async (req, res) => {
  try {
    // Verificar si se ha subido un archivo
    if(!req.file){
      return res.status(400).send({
        status: "error",
        message: "Error la petición no incluye la imagen"
      });
    }

    // Obtener la URL del archivo subido en Cloudinary
    const avatarUrl = req.file.path;

    // Guardar la imagen en la BD
    const userUpdated = await User.findByIdAndUpdate(
      req.user.userId,
      { image: avatarUrl },
      { new: true }
    );

    // Verificar si la actualización fue exitosa
    if(!userUpdated){
      return res.status(500).send({
        status: "error",
        message: "Error al subir el archivo del avatar"
      });
    }

    // Devolver respuesta exitosa
    return res.status(200).json({
      status: "success",
      user: userUpdated,
      file: avatarUrl
    });
  } catch (error) {
    console.log("Error al subir el archivo del avatar", error);
    return res.status(500).send({
      status: "error",
      message: "Error al subir el archivo del avatar"
    });
  };
};

// Metodo para mostrar el AVATAR (imagen de perfil)
export const avatar = async (req, res) => {
  try {
    // Obtener el ID desde el parámetro del archivo 
    const userId = req.params.id;

    // Buscar el usuario en la base de datos para obtener la URL de Cloudinary
    const user = await User.findById(userId).select('image');

    // Verificar si el usuario existe y tiene una imagen
    if(!user || !user.image){
      return res.status(404).send({
        status: "error",
        message: "No existe usuario o imagen"
      });
    }

    // Redirigir a la URL de la imagen en Cloudinary
    return res.redirect(user.image);
  } catch (error) {
    console.log("Error al mostrar el archivo del avatar", error);
    return res.status(500).send({
      status: "error",
      message: "Error al mostrar el archivo del avatar"
    });
  };
};

// Metodo para mostrar contador de seguidores y publicaciones
export const counters = async (req, res) => {
  try {
    // Obtener el Id del usuario autenticado (token)
    let userId = req.user.userId;

    // Si llega el id a través de los parámetros en la URL tiene prioridad
    if(req.params.id){
      userId = req.params.id;
    }

    // Obtener el nombre y apellido del usuario
    const user = await User.findById(userId, { name: 1, last_name: 1});

    // Vericar el user
    if(!user){
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado"
      });
    };

    // Contador de usuarios que yo sigo (o que sigue el usuario autenticado)
    const followingCount = await Follow.countDocuments({ "following_user": userId });

    // Contador de usuarios que me siguen a mi (que siguen al usuario autenticado)
    const followedCount = await Follow.countDocuments({ "followed_user": userId });

    // Contador de publicaciones del usuario autenticado
    const publicationsCount = await Publication.countDocuments({ "user_id": userId });

    // Devolver los contadores
    return res.status(200).json({
      status: "success",
      userId,
      name: user.name,
      last_name: user.last_name,
      followingCount: followingCount,
      followedCount: followedCount,
      publicationsCount: publicationsCount
    });
  } catch (error) {
    console.log("Error en los contadores", error)
    return res.status(500).send({
      status: "error",
      message: "Error en los contadores"
    });
  };
};