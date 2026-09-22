import { pointsApi } from '../services/api';

const useDailyLogin = () => {
  const claim = async () => {
    const key = `dailyLogin_${new Date().toISOString().split('T')[0]}`;
    if (sessionStorage.getItem(key)) return { yaReclamado: true };
    try {
      const result = await pointsApi.dailyLogin();
      if (!result.yaReclamado) {
        sessionStorage.setItem(key, 'true');
      }
      return result;
    } catch (err) {
      console.error('Daily login failed:', err);
      throw err;
    }
  };

  const claimWheel = async () => {
    try {
      const result = await pointsApi.claimWheelReward();
      return result;
    } catch (err) {
      console.error('Wheel claim failed:', err);
      throw err;
    }
  };

  return { claim, claimWheel };
};

export default useDailyLogin;
