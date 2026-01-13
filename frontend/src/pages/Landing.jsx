import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="z-10 text-center">
                <h1 className="text-5xl md:text-7xl font-bold text-slate-200 mb-12 tracking-tighter opacity-90">
                    PlanIt<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Now</span>
                </h1>

                <button
                    onClick={() => navigate('/context')}
                    className="group relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center shadow-[0_0_60px_rgba(220,38,38,0.4)] hover:shadow-[0_0_100px_rgba(220,38,38,0.6)] hover:scale-105 active:scale-95 transition-all duration-500 ease-out"
                >
                    <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    <span className="text-3xl md:text-4xl font-black text-white tracking-widest leading-tight drop-shadow-lg">
                        HELP<br />ME<br />NOW
                    </span>
                </button>

                <p className="mt-12 text-slate-500 text-sm uppercase tracking-[0.2em] font-medium">
                    Shared Autonomy System
                </p>
            </div>
        </div>
    );
};

export default Landing;
