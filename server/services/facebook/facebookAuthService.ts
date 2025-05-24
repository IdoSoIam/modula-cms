import type { 
  FacebookInitParams, 
  FacebookLoginStatus as FacebookAuthResponse,
  FacebookSDK
} from '~/types/facebook-sdk';

interface FacebookPage {
  access_token: string;
  id: string;
  name: string;
  tasks: string[];
}

export class FacebookAuthService {
  private static instance: FacebookAuthService;
  private initialized = false;

  static getInstance(): FacebookAuthService {
    if (!FacebookAuthService.instance) {
      FacebookAuthService.instance = new FacebookAuthService();
    }
    return FacebookAuthService.instance;
  }

  /**
   * Initialise le SDK Facebook
   */  private config = useRuntimeConfig()

  async initialize(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve) => {
      if (typeof window === 'undefined') return;

      if (window.FB) {
        this.initialized = true;
        resolve();
        return;
      }

      window.fbAsyncInit = () => {
        const FB = window.FB;
        if (!FB) return;
        
        const initParams: FacebookInitParams = {
          appId: this.config.public.facebookAppId as string,
          cookie: true,
          xfbml: true,
          version: 'v17.0'
        };
        FB.init(initParams);
        
        this.initialized = true;
        resolve();
      };

      // Charger le SDK
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/fr_FR/sdk.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    });
  }

  /**
   * Connecte l'utilisateur à Facebook et demande les permissions nécessaires
   */
  async login(): Promise<string> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      window.FB?.login((response: FacebookAuthResponse) => {
        if (response.authResponse) {
          resolve(response.authResponse.accessToken);
        } else {
          reject(new Error('Connexion Facebook échouée'));
        }
      }, { 
        scope: 'pages_show_list,pages_read_engagement',
        //return_scopes: true
      });
    });
  }

  /**
   * Récupère la liste des pages administrées par l'utilisateur
   */
  async getPages(userAccessToken: string): Promise<FacebookPage[]> {
    return new Promise((resolve, reject) => {
      window.FB?.api('/me/accounts?access_token=' + encodeURIComponent(userAccessToken), (response: any) => {
        if (response.error) {
          reject(new Error(response.error.message));
          return;
        }
        resolve(response.data);
      });
    });
  }

  /**
   * Récupère le token d'accès pour une page spécifique
   */
  async getPageAccessToken(pageId: string, pages: FacebookPage[]): Promise<string | null> {
    const page = pages.find(p => p.id === pageId);
    return page ? page.access_token : null;
  }

  /**
   * Vérifie si l'utilisateur est déjà connecté
   */
  async checkLoginStatus(): Promise<FacebookAuthResponse | null> {
    await this.initialize();

    return new Promise((resolve) => {
      window.FB?.getLoginStatus((response: FacebookAuthResponse) => {
        resolve(response);
      });
    });
  }

  /**
   * Déconnecte l'utilisateur
   */
  async logout(): Promise<void> {
    await this.initialize();

    return new Promise((resolve) => {
      window.FB?.logout(() => {
        resolve();
      });
    });
  }
}
