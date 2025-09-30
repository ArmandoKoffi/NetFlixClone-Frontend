import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Configuration de base pour les requêtes fetch
const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Gestionnaire d'erreurs global
const handleError = (error: any, toast: any) => {
  console.error('API Error:', error);
  
  if (error.message === 'Failed to fetch') {
    toast({
      title: "Erreur de connexion",
      description: "Impossible de se connecter au serveur. Vérifiez votre connexion.",
      variant: "destructive",
    });
    return;
  }

  const message = error.message || 'Une erreur est survenue';
  toast({
    title: "Erreur",
    description: message,
    variant: "destructive",
  });
};

// Service d'authentification
export const authService = {
  // Inscription
  async register(email: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: apiConfig.headers,
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },
  // Mise à jour du profil (email / mot de passe)
  async updateProfile(payload: { email?: string; currentPassword?: string; newPassword?: string }) {
    try {
      const token = localStorage.getItem('netflix_token');
      if (!token) throw new Error('Token manquant');

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          ...apiConfig.headers,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          // Session expirée ou token invalide
          localStorage.removeItem('netflix_token');
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        throw new Error(data.message || 'Erreur lors de la mise à jour du profil');
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Connexion
  async login(email: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: apiConfig.headers,
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Email ou mot de passe incorrect');
      }

      // Sauvegarder le token dans le localStorage
      if (data.token) {
        localStorage.setItem('netflix_token', data.token);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Mot de passe oublié
  async forgotPassword(email: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: apiConfig.headers,
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la demande de réinitialisation');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Réinitialisation du mot de passe
  async resetPassword(token: string, newPassword: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: apiConfig.headers,
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la réinitialisation');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Vérification d'email
  async verifyEmail(token: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: apiConfig.headers,
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la vérification');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Récupération du profil utilisateur
  async getProfile() {
    try {
      const token = localStorage.getItem('netflix_token');
      
      if (!token) {
        throw new Error('Token manquant');
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          ...apiConfig.headers,
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Si le token est invalide, le supprimer
        if (response.status === 401) {
          localStorage.removeItem('netflix_token');
        }
        throw new Error(data.message || 'Erreur lors de la récupération du profil');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Déconnexion
  logout() {
    localStorage.removeItem('netflix_token');
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return !!localStorage.getItem('netflix_token');
  },

  // Récupérer le token
  getToken(): string | null {
    return localStorage.getItem('netflix_token');
  },
};

// Service pour les films/séries (à implémenter plus tard)
export const moviesService = {
  async getMovies() {
    try {
      const token = authService.getToken();
      const headers: any = { ...apiConfig.headers };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/movies`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération des films');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async getMovieById(id: string) {
    try {
      const token = authService.getToken();
      const headers: any = { ...apiConfig.headers };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération du film');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },
  async getStreamingUrl(id: string) {
    try {
      // Utiliser l'endpoint sécurisé avec authentification
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentification requise pour accéder au streaming');
      }

      const response = await fetch(`${API_BASE_URL}/movies/${id}/watch`, {
        method: 'GET',
        headers: {
          ...apiConfig.headers,
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération de l\'URL de streaming');
      }

      // Retourner l'URL complète avec le token sécurisé
      return `${API_BASE_URL}${data.streamingUrl}`;
    } catch (error) {
      throw error;
    }
  },

  async resetMovies() {
    try {
      const response = await fetch(`${API_BASE_URL}/movies/reset`, {
        method: 'POST',
        headers: apiConfig.headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la réinitialisation des films');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },
};

// Service pour les paiements (à implémenter plus tard)
export const paymentService = {
  async createSubscription(paymentData: any) {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Authentification requise');
      }

      const response = await fetch(`${API_BASE_URL}/payments/subscribe`, {
        method: 'POST',
        headers: {
          ...apiConfig.headers,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création de l\'abonnement');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },
  async cancelSubscription() {
    try {
      const token = authService.getToken();
      if (!token) throw new Error('Authentification requise');
      const response = await fetch(`${API_BASE_URL}/payments/cancel`, {
        method: 'POST',
        headers: {
          ...apiConfig.headers,
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erreur lors de l\'annulation');
      return data;
    } catch (error) {
      throw error;
    }
  },
  async getSubscriptionStatus() {
    try {
      const token = authService.getToken();
      if (!token) throw new Error('Authentification requise');
      const response = await fetch(`${API_BASE_URL}/payments/status`, {
        method: 'GET',
        headers: {
          ...apiConfig.headers,
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erreur statut abonnement');
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export default {
  auth: authService,
  movies: moviesService,
  payments: paymentService,
};
