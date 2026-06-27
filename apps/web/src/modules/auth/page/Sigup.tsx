'use client';
import React from 'react';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { authApi } from '@/src/modules/auth/api';

export default function Signup() {
  const redirectToProvider = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-white font-sans">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          className="absolute inset-0 w-full h-full object-cover "
          src="https://i.pinimg.com/1200x/d9/c4/21/d9c421689d84cd36588733a3ac91a61c.jpg"
          alt=""
        />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-medium tracking-[-1px] text-black/80">
              Welcome to liking
            </h1>
            <p className="text-sm text-black/70">
              Continue with your preferred provider and start editing you latex code{' '}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => redirectToProvider(authApi.googleUrl)}
              className="w-full flex items-center justify-center gap-3 py-2 px-2 border border-dashed border-black/20 rounded-[3px]  bg-white text-sm font-medium hover:bg-gray-50 transition-all"
            >
              <FcGoogle className=" text-lg" />

              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => redirectToProvider(authApi.githubUrl)}
              className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-dashed border-black/20 rounded-[3px]  bg-white text-sm font-medium  hover:bg-gray-50 transition-all"
            >
              <FaGithub className=" text-lg" />
              <span>continue with GitHub</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed pt-4">
            By creating an account, you agree to our{' '}
            <a href="/terms" className="underline hover:text-gray-900">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-gray-900">
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
