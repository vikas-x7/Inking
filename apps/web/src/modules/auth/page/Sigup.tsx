'use client';
import React from 'react';
import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { authApi } from '@/src/modules/auth/api';

export default function Signup() {
  const redirectToProvider = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-black font-sans">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src="https://i.pinimg.com/1200x/87/82/91/8782911822f5704636de714b7f5443cc.jpg"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/50" />
        <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-8 py-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image/logo.png" alt="Inking Logo" className="w-6 h-6" />
          <span className="text-xl font-bold tracking-tight text-white">Inking</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-10">
          <p className="text-white text-lg sm:text-xl font-medium leading-relaxed max-w-md">
            Write, preview, and export clean LaTeX documents from one focused editor.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md mx-auto text-center space-y-8">
            <div className="flex flex-col items-center justify-center space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/image/logo.png" alt="Inking Logo" className="w-10 h-10 mb-2 object-contain" />
              <h1 className="text-3xl sm:text-3xl font-bold tracking-[-0.5px] text-white">
                Sign in to Inking
              </h1>
              <p className="text-base text-white/50 font-normal">
               Write and manage LaTeX documents
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => redirectToProvider(authApi.googleUrl)}
                className="w-full flex items-center justify-center gap-3 py-2 px-2 rounded-[3px] bg-white text-sm font-medium hover:bg-gray-50 transition-all cursor-pointer text-black"
              >
                <FcGoogle className="text-lg" />
                <span>Continue with Google</span>
              </button>

              <button
                onClick={() => redirectToProvider(authApi.githubUrl)}
                className="w-full flex items-center justify-center gap-3 py-2 px-4 rounded-[3px] bg-white text-sm font-medium hover:bg-gray-50 transition-all cursor-pointer text-black"
              >
                <FaGithub className="text-lg" />
                <span>Continue with GitHub</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pb-8 text-xs text-white/70 mx-auto text-center leading-relaxed">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="underline hover:text-white">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-white">
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </div>
  );
}
