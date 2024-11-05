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