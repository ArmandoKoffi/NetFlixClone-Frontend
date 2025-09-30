import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { CreditCard, Shield, Lock, CheckCircle, XCircle } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { NetflixButton } from '@/components/ui/netflix-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { updateSubscription } from '@/store/slices/authSlice';

// Stripe Elements
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Configuration Stripe (clé publique de test)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SBc7MPbdMUVanRJrA16CGq2vHv6VtUkdfMrbCcUOSRaKumenBxFlbxBSYrmcWAf0sNqaXCCvbY9CQTM3bP43MKG00E5UXhZcA');

// Composant de formulaire de paiement Stripe
const StripePaymentForm = ({ plan, onSuccess }: { plan: string; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Créer une vraie PaymentMethod via Stripe Elements
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Champ de carte introuvable');
      }

      const pmResult = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          // Optionnel: vous pouvez demander ces infos dans le formulaire
          email: undefined,
        },
      });

      if (pmResult.error || !pmResult.paymentMethod) {
        throw new Error(pmResult.error?.message || 'Impossible de créer la méthode de paiement');
      }

      // Appeler notre backend avec la PaymentMethod créée
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('netflix_token')}`
        },
        body: JSON.stringify({
          plan,
          paymentMethodId: pmResult.paymentMethod.id,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création de l\'abonnement');
      }

      // Si Stripe nécessite une action supplémentaire (3D Secure)
      if (data.requiresAction && data.clientSecret) {
        const { error: stripeError } = await stripe.confirmCardPayment(data.clientSecret);
        
        if (stripeError) {
          throw new Error(stripeError.message || 'Erreur lors de la confirmation du paiement');
        }
      }

      toast({
        title: "Paiement réussi !",
        description: data.message,
      });

      onSuccess();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors du paiement";
      setError(errorMessage);
      toast({
        title: "Erreur de paiement",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Champ de carte Stripe */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Informations de carte
        </label>
        <div className="p-3 border border-netflix-light-gray rounded-md bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <XCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Informations de test */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
        <div className="text-sm text-yellow-800">
          <strong>Mode test Stripe :</strong> Utilisez les numéros de carte de test
          <div className="mt-1 text-xs">
            • Carte réussie: 4242 4242 4242 4242
            <br />
            • Carte 3D Secure: 4000 0025 0000 3155
            <br />
            • Carte échouée: 4000 0000 0000 9995
          </div>
        </div>
      </div>

      <NetflixButton
        type="submit"
        variant="netflix"
        size="lg"
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? "Traitement..." : `S'abonner - ${plan === 'basic' ? '9.99€' : '15.99€'}/mois`}
      </NetflixButton>
    </form>
  );
};

const Payment = () => {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('premium');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const userData = location.state?.userData;
  const isNewUser = location.state?.newUser;

  const handlePaymentSuccess = () => {
    setPaymentCompleted(true);
    
    // Mettre à jour l'état Redux
    dispatch(updateSubscription({
      subscription: selectedPlan,
      subscriptionExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
    }));

    // Rediriger après 2 secondes
    setTimeout(() => {
      navigate('/home');
    }, 2000);
  };

  if (paymentCompleted) {
    return (
      <AuthLayout 
        title="Abonnement activé !" 
        subtitle="Redirection vers votre compte..."
      >
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-semibold">Félicitations !</h3>
          <p className="text-muted-foreground">
            Votre abonnement {selectedPlan} a été activé avec succès.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Abonnement Netflix" 
      subtitle={isNewUser ? "Finalisez votre inscription" : "Renouveler votre abonnement"}
    >
      <div className="space-y-6">
        {/* Sélection du plan */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className={`cursor-pointer transition-all ${
              selectedPlan === 'basic' 
                ? 'border-netflix-red bg-netflix-red/10' 
                : 'border-netflix-light-gray hover:border-netflix-red/50'
            }`}
            onClick={() => setSelectedPlan('basic')}
          >
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-sm">Basic</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-1">
              <div className="text-xl font-bold">9.99€</div>
              <div className="text-xs text-muted-foreground">par mois</div>
              <div className="text-xs text-muted-foreground">HD • 1 écran</div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${
              selectedPlan === 'premium' 
                ? 'border-netflix-red bg-netflix-red/10' 
                : 'border-netflix-light-gray hover:border-netflix-red/50'
            }`}
            onClick={() => setSelectedPlan('premium')}
          >
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-sm text-netflix-red">Premium</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-1">
              <div className="text-xl font-bold">15.99€</div>
              <div className="text-xs text-muted-foreground">par mois</div>
              <div className="text-xs text-muted-foreground">Ultra HD • 4 écrans</div>
            </CardContent>
          </Card>
        </div>

        {/* Détails du plan sélectionné */}
        <Card className="bg-gradient-card border-netflix-light-gray">
          <CardHeader className="text-center">
            <CardTitle className={selectedPlan === 'premium' ? 'text-netflix-red' : ''}>
              Plan {selectedPlan === 'basic' ? 'Basic' : 'Premium'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <div className="text-3xl font-bold text-foreground">
              {selectedPlan === 'basic' ? '9.99€' : '15.99€'}
            </div>
            <div className="text-sm text-muted-foreground">par mois</div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              {selectedPlan === 'basic' ? 'HD • 1 écran simultané' : 'Ultra HD • 4 écrans simultanés'}
            </div>
          </CardContent>
        </Card>

        {/* Formulaire de paiement Stripe */}
        <Elements stripe={stripePromise}>
          <StripePaymentForm plan={selectedPlan} onSuccess={handlePaymentSuccess} />
        </Elements>

        <div className="text-center text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="h-3 w-3" />
            <span>Paiement 100% sécurisé par Stripe</span>
          </div>
          <p>🔒 Données cryptées • Annulation à tout moment</p>
          <p className="mt-1">
            Système de paiement réel en mode test - Aucun vrai compte ne sera débité
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Payment;
