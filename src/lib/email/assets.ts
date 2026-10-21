const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'https://www.holyannexplore.com';

export const EMAIL_ASSETS = {
  resetPass: {
    background: `${BASE_URL}/email/resetpass/Background.png`,
    logo: `${BASE_URL}/email/resetpass/Logo.png`,
    text: `${BASE_URL}/email/resetpass/Text.png`,
  },
  welcome: {
    background: `${BASE_URL}/images/backgrounds/Background.png`,
  },
  meeting: {
    background: `${BASE_URL}/email/meeting/back-noholie.png`,
    logo: `${BASE_URL}/email/meeting/Logo%20(1).png`,
    mascot: `${BASE_URL}/email/meeting/Mascot.png`,
  },
};
