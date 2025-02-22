"use client";

import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';

export default function SignInWithGoogle() {
  const { signIn } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      // For now, we'll just show an alert since Google sign-in isn't implemented yet
      alert('Google Sign In will be implemented soon!');
    } catch (error) {
      console.error('Google sign in failed:', error);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
    >
      <Image
        src="/google-icon.png"
        alt="Google"
        width={20}
        height={20}
        className="w-5 h-5"
      />
      Sign in with Google
    </button>
  );
}
