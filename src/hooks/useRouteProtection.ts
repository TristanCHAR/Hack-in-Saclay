import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook pour protéger les routes enfant
 * Redirige vers /login si pas d'auth enfant
 */
export const useChildRoute = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const childAuth = localStorage.getItem('childAuth');
        if (!childAuth) {
            // Pas d'auth enfant, rediriger vers login enfant
            navigate('/auth/child/login', { replace: true });
        }
    }, [navigate]);
};

/**
 * Hook pour protéger les routes parent
 * Redirige vers /auth/child/login si auth enfant détecté
 */
export const useParentRoute = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const childAuth = localStorage.getItem('childAuth');
        if (childAuth) {
            // Auth enfant détecté sur route parent, rediriger
            navigate('/app/jeux', { replace: true });
        }
    }, [navigate]);
};
