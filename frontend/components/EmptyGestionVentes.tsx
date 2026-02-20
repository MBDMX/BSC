import React from 'react';

const EmptyGestionVentes: React.FC = () => {
    return (
        <div className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center" style={{ backdropFilter: 'blur(10px)', background: 'rgba(255, 255, 255, 0.9)' }}>
                    <div className="mb-6">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-12 h-12 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-[#03224c] mb-2">
                            💰 Gestion des Ventes
                        </h2>
                        <p className="text-lg text-gray-600 mb-6">
                            Suivi détaillé des transactions et du chiffre d'affaires
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3 mx-auto">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-blue-800 mb-1">Commandes</h3>
                            <p className="text-blue-600 text-sm">Historique des ventes en temps réel</p>
                        </div>

                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-lg border border-pink-200">
                            <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center mb-3 mx-auto">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-pink-800 mb-1">Statistiques</h3>
                            <p className="text-pink-600 text-sm">Analytique des ventes par produit</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3 mx-auto">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-green-800 mb-1">Paiements</h3>
                            <p className="text-green-600 text-sm">Gestion des modes de règlement</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-8 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-center">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                Module en cours d'intégration
                            </h3>
                            <p className="text-gray-500 mb-4">
                                L'interface de gestion des ventes est en cours de développement pour vous offrir une expérience optimale.
                            </p>
                            <div className="inline-flex items-center px-4 py-2 bg-pink-50 text-pink-700 rounded-lg">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Développement actif
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmptyGestionVentes;
