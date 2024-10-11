// Metodo de prueba del controlador user
export const testUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controlador de Usuarios"
  });
};

// Metodos Registro de Usuarios
export const register = (req, res) => {
  try {
    // Obtener los datos de la peticion
    let params = req.body;

    // Validar los datos obtenidos

    // Cifrar la contraseña

    // Devolver el usuario registrado
    return res.status(200).json({
      message: "Registro de usuario exitoso",
      params
    });

  } catch (error) {
    console.log("", error);
    return res.status(500).send({
      status: "error",
      message: "Error en el Registro de usuarios"
    });
  }
};