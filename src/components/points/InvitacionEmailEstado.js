import { createElement } from 'react';

/** Estado de entrega independiente del progreso de reservas de la invitación. */
export default function InvitacionEmailEstado({ emailEstado, t }) {
  const clave = emailEstado === 'inexistente' ? 'points.inviteInvalidEmail'
    : emailEstado === 'no_enviado' ? 'points.inviteNotSent' : null;
  return clave ? createElement('p', { className: 'invite-item__email-error', role: 'status' }, t(clave)) : null;
}
