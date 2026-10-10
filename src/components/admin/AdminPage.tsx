import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { AdminApp } from '@/components/admin/AdminApp';
import { Lock, Loader2, UserPlus, KeyRound, Swords, Eye, EyeOff } from 'lucide-react';

export function AdminPage() {
  const { isAuthenticated, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [info, setInfo] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-katana-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Swords className="w-10 h-10 text-katana-crimson" />
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AdminApp />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setInfo('');

    if (mode === 'signup') {
      if (secretCode !== '80811') {
        setSubmitting(false);
        setError('Invalid secret code. Access denied, miya.');
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      setSubmitting(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.user) {
        setInfo('Account created! You can now sign in.');
        setMode('signin');
      }
      return;
    }

    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
    }
  };

  return (
    <div className="min-h-screen bg-katana-black relative overflow-hidden flex items-center justify-center px-4">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-katana-crimson/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-katana-gold/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-grain opacity-15" />
      </div>

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-katana-crimson/20"
          style={{
            left: `${10 + i * 8}%`,
            top: `${15 + (i % 4) * 22}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 4 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo emblem */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-sm bg-katana-crimson/10 border border-katana-crimson/30 mb-4 relative"
          >
            <Swords className="w-9 h-9 text-katana-crimson" />
            <motion.div
              className="absolute inset-0 rounded-sm border border-katana-crimson/20"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
          <h1 className="font-display font-700 text-katana-bone text-2xl tracking-[0.15em]">
            KATANA <span className="text-katana-crimson">ADMIN</span>
          </h1>
          <p className="text-katana-silver/40 text-sm mt-2 font-cinematic">
            {mode === 'signin' ? 'Sign in to manage your content, miya' : 'Create a new admin account'}
          </p>
        </div>

        {/* Form card */}
        <div className="katana-border rounded-sm bg-katana-coal/60 backdrop-blur-md p-6 space-y-5 relative overflow-hidden">
          {/* Sheen effect */}
          <motion.div
            className="absolute -inset-x-full -top-1/2 h-full bg-gradient-to-r from-transparent via-katana-crimson/5 to-transparent pointer-events-none"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />

          <form onSubmit={handleSubmit} className="space-y-4 relative">
            <div>
              <label className="block text-xs uppercase tracking-wider text-katana-gold/60 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone focus:border-katana-crimson/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-katana-gold/60 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-11 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone focus:border-katana-crimson/50 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-katana-silver/30 hover:text-katana-crimson transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-xs uppercase tracking-wider text-katana-gold/60 mb-1.5">Secret Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-katana-silver/30" />
                    <input
                      type="password"
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-katana-ash/40 border border-katana-silver/15 rounded text-sm text-katana-bone focus:border-katana-crimson/50 focus:outline-none transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-katana-crimson text-sm bg-katana-crimson/10 border border-katana-crimson/20 rounded px-3 py-2"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {info && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-katana-gold text-sm bg-katana-gold/10 border border-katana-gold/20 rounded px-3 py-2"
                >
                  {info}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              className="w-full px-4 py-3 bg-katana-crimson/15 border border-katana-crimson/40 text-katana-crimson rounded font-display uppercase tracking-wider text-sm hover:bg-katana-crimson/25 hover:border-katana-crimson/60 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</>
              ) : (
                <><Lock className="w-4 h-4" /> {mode === 'signin' ? 'Enter the Darbar' : 'Create Account'}</>
              )}
            </motion.button>
          </form>

          <div className="text-center pt-1 relative">
            {mode === 'signin' ? (
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); setInfo(''); setSecretCode(''); }}
                className="inline-flex items-center gap-1.5 text-katana-silver/40 hover:text-katana-crimson text-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Need an account? Sign up
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); setInfo(''); }}
                className="text-katana-silver/40 hover:text-katana-crimson text-sm transition-colors"
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        </div>

        <p className="text-center mt-6">
          <a href="/" className="text-katana-silver/30 hover:text-katana-crimson text-sm transition-colors inline-flex items-center gap-1">
            ← Back to site
          </a>
        </p>
      </motion.div>
    </div>
  );
}
