import User from '../models/users.js';
import bcrypt from 'bcrypt';
import { createToken } from '../services/jwt.js';

// Metodo de prueba del controlador user
export const testUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controlador de Usuarios"
  });
};

// Metodos Registro de Usuarios
export const register = async (req, res) => {
  try {
    // Obtener los datos de la peticion
    let params = req.body;

    // Validar los datos obtenidos
    if (!params.name || !params.last_name || !params.nick || !params.email || !params.password) {
      return res.status(400).json({
        status: "error",
        message: "Faltan datos por enviar",
      });
    };

    // Crear el objeto del usuario con los datos que validamos
    let user_to_save = new User(params);

    // Control de usuarios duplicados
    const existingUser = await User.findOne({
      $or: [
        { email: user_to_save.email.toLowerCase() },
        { nick: user_to_save.nick.toLowerCase() }
      ],
    });

    //Validar el existingUser
    if (existingUser) {
      return res.status(200).send({
        status: "success",
        message: "El usuario ya existe"
      });
    }

    // Cifrar la contraseña
    // Genera los saltos para encriptar
    const salt = await bcrypt.genSalt(10);

    // Encriptar la contraseña y guardarla en la constante
    const hashedPassword = await bcrypt.hash(user_to_save.password, salt);

    // Asignar la contraseña encriptada al objeto del usuario
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
    return res.status(500).send({
      status: "error",
      message: "Error en el Registro de usuarios"
    });
  };
};

// Metodo de Login (user JWT)
export const login = async (req, res) => {
  try {
    // Obtener los parametros del body enviados en la peticion
    let params = req.body;

    // Validar que si recibimos el email y password
    if (!params.email || !params.password) {
      return res.status(400).send({
        status: "error",
        message: "Faltan datos para autenticar el usuario"
      });
    };

    // Buscar en la DB si existe el email registrado
    const userDB = await User.findOne({ email: params.email.toLowerCase() });

    // Si no existe el usuario buscado
    if (!userDB) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado",
      })
    };

    // Comprobar su contraseña
    const validPassword = await bcrypt.compare(params.password, userDB.password);

    // Si la contraseña es incorrecta
    if (!validPassword) {
      return res.status(401).send({
        status: "error",
        message: "Contraseña incorrecta"
      });
    };

    // Generar token de autenticacion (JWT)
    const token = createToken(userDB);

    // Devolver respuesta de login exitoso
    return res.status(200).json({
      status: "success",
      message: "Autenticacion exitosa",
      token,
      userDB: {
        id: userDB._id,
        name: userDB.name,
        last_name: userDB.last_name,
        email: userDB.email,
        nick: userDB.nick,
        image: userDB.image,
      }
    });
  } catch (error) {
    console.log("Error en la autenticacion del usuario: ", error);
    return res.status(500).send({
      status: "error",
      message: "Error en la autenticacion del usuario"
    });
  }
};

// Metodo para mostrar el perfil de un usuario
export const profile = async (req, res) => {
  try {
    // Obtener el ID del usuario desde los parametros de la URL
    const userId = req.params.id;
    // Verificar si el ID del usuario autenticado esta disponible
    if (!req.user || !req.user.userId) {
      return res.status(500).send({
        status: "success",
        message: "Usuario no autenticado"
      });
    };

    // Buscar el usuario en la BD y excluimos los datos que no queremos mostrar
    const userProfile = await User.findById(userId).select('-password -role -email -__v');
    // Verificar si el usuario buscado no existe
    if (!userProfile) {
      return res.status(404).send({
        status: "success",
        message: "Usuario no encontrado"
      });
    };

    // Devolver la informacion del perfil del usuario solicitado
    return res.status(200).send({
      status: "success",
      user: userProfile,

    });

  } catch (error) {
    console.log('Error al obtener el perfil del usuario: ', error);
    return res.status(500).send({
      status: "error",
      message: "Error al obtener el perfil del usuario"
    });
  }
};

// Metodo para listar los usuarios
export const listUsers = async (req, res) => {
  try {
    // Gestionar la paginacion
    // 1. Controlar la pagina actual
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;
    // 2. Configurar los items por pagina a mostrar
    let itemsPerPage = req.query.limit ? parseInt(req.params.page, 10) : 4;

    // Realizar consulta paginada
    const options = {
      page: page,
      limit: itemsPerPage,
      select: '-password -email -role -__v'
    };

    const users = await User.paginate({}, options);

    // Si no existen usuarios en la BD disponibles
    if (!users || users.docs.length === 0) {
      return res.status(404).send({
        status: "error",
        message: "No existen usuarios disponibles"
      });
    };

    // Devolver los usuarios paginados
    return res.status(200).send({
      status: "success",
      users: users.docs,
      totalDocs: users.totalDocs,
      totalPages: users.totalPages,
      CurrentPage: users.page
    });

  } catch (error) {
    console.log("Error al listar los usuarios: ", error);
    return res.status(500).send({
      status: "error",
      message: "Error al listar los usuarios"
    })
  }
};

// Metodo para actualizar los datos del usuario
export const updateUser = async (req, res) => {
  try {
    // Obtener la informacion del usuario a actualizar
    let userIdentity = req.user; // El usuario autenticado en el token, lo trae desde el middleware auth.js
    let userToUpdate = req.body; // Recoge los datos nuevos del usuario desde el formulario

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

    // Verificar si el usuario esta duplicado para evitar conflictos
    const isDuplicateUser = users.some(user => {
      return user && user._id.toString() !== userIdentity.userId;
    });

    if (isDuplicateUser) {
      return res.status(400).send({
        status: "error",
        message: "Error, solo se puede actualizar los datos del usuario logueado"
      });
    };
    
    // Cifrar la contraseña en caso que la envien
    if (userToUpdate.password) {
      try {
        let pwd = await bcrypt.hash(userToUpdate.password, 10);
        userToUpdate.password = pwd;
      } catch (error) {
        res.status(500).send({
          status: "error",
          message: "Error al cifrar la contraseña"
        });
      };
    } else {
        delete userToUpdate.password;
    };

    // Buscar y actualizar el usuario en Mongo
    let userUpdated = await User.findByIdAndUpdate(userIdentity.userId, userToUpdate, { new: true });

    if (!userUpdated) {
        return res.status(400).send({
          status: "error",
          message: "Error al actualizar el usuario"
        });
    };

    // Devolver la respuesta existosa
    return res.status(200).send({
      status: "success",
      message: "Usuario actualizado correctamente",
      user: userUpdated
    });
  } catch (error) {
    console.log("Error al actualizar los datos de los usuario: ", error);
    return res.status().send({
      status: "error",
      message: "Error al actualizar los datos de los usuario"
    });
  }
};