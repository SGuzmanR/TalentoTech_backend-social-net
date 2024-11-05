import jwt from 'jwt-simple';
import moment from 'moment';

const secret = 'SECRET_KEY_pRoJeCt_sOcIaL_net.@';

// Metodo para generar tokens
// Unix: segundos transcurridos desde el 1 enero de 1970 hasta hoy
const createToken = (user) => {
  const payload = {
    userId: user._id,
    role: user.role,
    iat: moment().unix(), // fecha de emisión
    exp: moment().add(7, 'days').unix() // fecha de expiración
  };
  // Devolver el jwt token codificado
  return jwt.encode(payload, secret);
};

export { secret, createToken };