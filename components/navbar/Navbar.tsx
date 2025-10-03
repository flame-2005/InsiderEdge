import { useUserContext } from '@/context/UserContext';
import { TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation';
import React from 'react'

const Navbar = () => {

    const { user, signOut } = useUserContext();
      const router = useRouter();

    return (
        <div className="border-b border-gray-200/50 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo/Title */}
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br hidden md:flex from-blue-600 to-indigo-600 rounded-2xl items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                            <TrendingUp className="w-7 h-7 text-white " />
                        </div>
                        <div>
                            <h1 className="md:text-2xl text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Market Activity
                            </h1>
                            <p className="text-xs text-gray-500 font-medium">Real-time exchange updates</p>
                        </div>
                    </div>

                    {/* Auth Button */}
                    {user ? (
                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-semibold text-emerald-700">Active</span>
                            </div>
                            <button
                                onClick={signOut}
                                className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                <span>Sign Out</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => router.push("/login")}
                            className=" md:px-5 px-2 py-2.5 rounded-xl md:font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2 text-sm md:text-md"
                        >
                            <span>Sign in for updates</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Navbar
