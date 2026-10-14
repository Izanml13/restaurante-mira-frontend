import { useEffect, useState } from 'react';
import InvitacionEmailEstado from './InvitacionEmailEstado.js';
import useInviteStore from '../../stores/useInviteStore.js';
import { useT } from '../../i18n/index.jsx';
import es from '../../i18n/es.js';
import ca from '../../i18n/ca.js';
import en from '../../i18n/en.js';

import { suscribirSesion } from '../../services/authApi.js';
import { emailInvitacionValido } from '../../services/invitacionEmail.js';

const TRADS = { es, ca, en };

export default function InvitePanel() {
  const t = useT(TRADS);
  const [sesion, setSesion] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const { enviadas, aceptadas, puntosTotales, createInvite, fetchMyInvites, reset, error: loadError } = useInviteStore();

  // F5: el panel puede montarse antes de que Firebase restaure currentUser.
  useEffect(() => suscribirSesion((usuario) => {
    setSesion(Boolean(usuario));
    if (usuario) fetchMyInvites();
    else reset();
  }), [fetchMyInvites, reset]);

  async function handleInvite(e) {
    e.preventDefault();
    setSuccess(false);
    if (!emailInvitacionValido(email)) {
      setError(t('points.inviteInvalidEmail'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const invitacion = await createInvite(email.trim());
      if (invitacion.emailEstado === 'no_enviado') setError(t('points.inviteNotSent'));
      else if (invitacion.emailEstado === 'inexistente') setError(t('points.inviteInvalidEmail'));
      else setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err.message || t('points.inviteError'));
    } finally {
      setLoading(false);
    }
  }

  async function copyLink(link) {
    setError('');
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError(err.message || t('points.inviteError'));
    }
  }

  return (
    <div className="invite-panel">
      <h3>{t('points.invite')}</h3>
      <p
        className="invite-panel__info"
        dangerouslySetInnerHTML={{ __html: t('points.inviteInfo') }}
      />

      {sesion === null && <p role="status">{t('otros.cargando')}</p>}
      {sesion === false && <a href="#/login">{t('nav.iniciarSesion')}</a>}
      <form noValidate className="invite-form" onSubmit={handleInvite}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('points.inviteEmailPlaceholder')}
          required
        />
        <button type="submit" className="btn-cta" disabled={loading || !sesion}>
          {loading ? t('points.inviteSending') : t('points.inviteSend')}
        </button>
        <div className="invite-feedback" aria-live="polite">
          {success && <p role="status">{t('points.inviteSuccess')}</p>}
          {error && <p className="invite-error" role="alert">{error}</p>}
        </div>
      </form>
      {loadError && <p className="invite-error" role="alert">{loadError}</p>}

      <div className="invite-stats">
        <div className="invite-stat">
          <span className="invite-stat__value">{enviadas.length}</span>
          <span className="invite-stat__label">{t('points.inviteSent')}</span>
        </div>
        <div className="invite-stat">
          <span className="invite-stat__value">{aceptadas}</span>
          <span className="invite-stat__label">{t('points.inviteAccepted')}</span>
        </div>
        <div className="invite-stat">
          <span className="invite-stat__value">{puntosTotales}</span>
          <span className="invite-stat__label">{t('points.invitePointsEarned')}</span>
        </div>
      </div>

      {enviadas.length > 0 && (
        <div className="invite-list">
          {enviadas.map((inv) => (
            <div key={inv.id} className="invite-item">
              <span className="invite-item__email">{inv.emailInvitado || inv.invitadoEmail}</span>
              <span className={`invite-item__status invite-item__status--${inv.estado}`}>
                {inv.estado === 'aceptada'
                  ? '✅'
                  : inv.estado === 'esperando_2_reservas' || inv.estado === 'pendiente'
                    ? '⏳'
                    : '❌'}
              </span>
              <InvitacionEmailEstado emailEstado={inv.emailEstado} t={t} />
              {inv.link && (
                <button className="btn-texto" onClick={() => copyLink(inv.link)}>
                  {copied ? t('points.inviteCopied') : t('points.inviteCopyLink')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
