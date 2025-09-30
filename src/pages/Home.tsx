import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Info, Plus, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { NetflixButton } from '@/components/ui/netflix-button';
import { RootState } from '@/store/store';
import { setMovies } from '@/store/slices/moviesSlice';
import { moviesService } from '@/services/api';

const Home = () => {
  const dispatch = useDispatch();
  const { movies, featuredMovie } = useSelector((state: RootState) => state.movies);
  const [isResetting, setIsResetting] = useState(false);

  const loadMovies = async () => {
    try {
      const data = await moviesService.getMovies();
      // Adapter le format attendu par le slice si nécessaire
      const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const adapted = data.movies.map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        genre: m.genre,
        year: m.year,
        rating: m.rating,
        duration: m.duration,
        image: String(m.thumbnailUrl || '').startsWith('http') ? m.thumbnailUrl : `${API}${m.thumbnailUrl || ''}`,
      }));
      dispatch(setMovies(adapted));
    } catch (e) {
      console.error('Erreur chargement films:', e);
    }
  };

  const handleResetMovies = async () => {
    setIsResetting(true);
    try {
      await moviesService.resetMovies();
      await loadMovies();
      alert('Catalogue réinitialisé avec les nouvelles correspondances !');
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      alert('Erreur lors de la réinitialisation');
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    loadMovies();
  }, [dispatch]);

  // Recharger automatiquement les films au montage du composant
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMovies();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getMoviesByGenre = (genre: string) => {
    return movies.filter(movie => movie.genre === genre);
  };

  const genres = [...new Set(movies.map(movie => movie.genre))];

  if (!featuredMovie) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Boutons de debug (temporaire pour développement) */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={handleResetMovies}
          disabled={isResetting}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          {isResetting ? 'Réinitialisation...' : 'Reset Films'}
        </button>
        <button
          onClick={loadMovies}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Recharger
        </button>
      </div>
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${featuredMovie.image}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-overlay" />
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold text-white mb-4"
            >
              {featuredMovie.title}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg text-white/90 mb-6 leading-relaxed"
            >
              {featuredMovie.description}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex gap-4"
            >
              <Link to={`/watch/${featuredMovie.id}`}>
                <NetflixButton variant="hero" size="xl">
                  <Play className="h-6 w-6 mr-2" />
                  Regarder
                </NetflixButton>
              </Link>
              
              <Link to={`/movie/${featuredMovie.id}`}>
                <NetflixButton variant="secondary" size="xl">
                  <Info className="h-6 w-6 mr-2" />
                  Plus d'infos
                </NetflixButton>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="relative z-10 -mt-32 space-y-12 pb-20">
        {genres.map((genre, genreIndex) => {
          const genreMovies = getMoviesByGenre(genre);
          if (genreMovies.length === 0) return null;

          return (
            <motion.section
              key={genre}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: genreIndex * 0.1 }}
              className="container mx-auto px-4"
            >
              <h2 className="text-2xl font-bold text-white mb-6">{genre}</h2>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {genreMovies.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="flex-shrink-0 group"
                  >
                    <Link to={`/movie/${movie.id}`}>
                      <div className="relative w-64 h-36 rounded-lg overflow-hidden bg-gradient-card">
                        <img
                          src={movie.image}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          onContextMenu={(e) => e.preventDefault()}
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjE0NCIgdmlld0JveD0iMCAwIDI1NiAxNDQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMTQ0IiBmaWxsPSIjMTExMTExIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2NjY2IiBmb250LXNpemU9IjE0Ij5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+';
                          }}
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="font-semibold text-white text-sm mb-1">
                              {movie.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-white/80">
                              <span>{movie.year}</span>
                              <span>•</span>
                              <span>{movie.rating}</span>
                              <span>•</span>
                              <span>{movie.duration}</span>
                            </div>
                          </div>
                          
                          <div className="absolute top-2 right-2">
                            <NetflixButton variant="ghost" size="icon" className="h-8 w-8">
                              <Plus className="h-4 w-4" />
                            </NetflixButton>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
};

export default Home;