import React from 'react'
import { MessageSquare, Users, Zap } from 'lucide-react';   

const NoChatSelected = () => {
    return (
        <div className="w-full flex flex-1 flex-col items-center justify-center p-8 lg:p-16 bg-gradient-to-br from-blue-50/50 via-white/50 to-purple-50/50 dark:from-blue-900/20 dark:via-gray-800/50 dark:to-purple-900/20">
            <div className="max-w-md text-center space-y-8">
                {/* Animated Icons */}
                <div className="flex justify-center gap-4 mb-8">
                    <div className="relative">
                        <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 flex items-center justify-center animate-bounce">
                            <MessageSquare className="w-8 h-8 lg:w-10 lg:h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                            <Zap className="w-3 h-3 text-white" />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-4">
                    <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> 
                        Welcome to Netsphere Chat!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-base lg:text-lg leading-relaxed">
                        Connect with friends and colleagues in real-time. Select a conversation from the sidebar to start chatting.
                    </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 gap-4 mt-8 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Real-time messaging</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">See who's online</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Share photos instantly</span>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        👈 Choose a contact from the sidebar to start messaging
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NoChatSelected