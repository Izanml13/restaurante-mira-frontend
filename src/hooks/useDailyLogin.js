import { pointsApi } from '../services/api.js';

const useDailyLogin = () => {
  const claim = async () => {
    const result = await pointsApi.dailyLogin();
    return result;
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
