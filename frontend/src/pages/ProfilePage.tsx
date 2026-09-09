import React, { useState } from 'react';
import Background from '../components/ui/Background';
import Navbar from '../components/ui/Navbar';
import ProfileCard from '../components/ui/ProfileCard';
import GameUI from '../components/ui/GameUI';
import Card from '../components/ui/Card';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('PROFILE');

  return (
    <Background>
      {/* 1. NAVBAR FLEXIBLE */}
      <Navbar activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

      {/* 2. CONTENU PRINCIPAL (GRILLE RESPONSIVE) */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-8 flex flex-col lg:flex-row items-start justify-center gap-8">
        
        {/* COLONNE GAUCHE : Carte Profil Joueur avec Avatar Circulaire */}
        <div className="w-full lg:w-auto flex justify-center">
          <ProfileCard
            username="NOUSS"
            statusText="Ready to play"
            level={24}
            currentXp={2350}
            maxXp={3000}
            stats={{
              matchesPlayed: 243,
              wins: 176,
              losses: 67,
              winRate: 72,
            }}
          />
        </div>

        {/* COLONNE DROITE : Historique des Matchs & Rang Actuel */}
        <div className="w-full lg:flex-1 flex flex-col gap-6 max-w-xl">
          
          {/* Tableau de l'historique des parties */}
          <GameUI />

          {/* Carte Rang Actuel (Diamond II) */}
          <Card variant="gray" className="w-full flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              {/* Emoji placeholder temporaire pour le trophée/diamant */}
              <div className="text-5xl drop-shadow-glow-pink">💎</div>
              <div>
                <span className="font-pixelify text-xs text-pacova-pink uppercase tracking-widest block">
                  CURRENT RANK
                </span>
                <h3 className="font-pixelify text-2xl text-pacova-green">
                  DIAMOND II
                </h3>
                <div className="text-yellow-400 text-sm mt-1">★★★★☆</div>
                <span className="font-vt323 text-xs text-gray-400 block mt-1">
                  TOP 12% OF PLAYERS
                </span>
              </div>
            </div>

            {/* Barre de progression du Rang */}
            <div className="w-28 space-y-1">
              <div className="w-full h-2 bg-gray-900 border border-pacova-green/40 rounded-full overflow-hidden">
                <div className="h-full bg-pacova-green w-[72%] shadow-neon-green" />
              </div>
              <span className="font-vt323 text-xs text-gray-400 text-right block">
                72%
              </span>
            </div>
          </Card>

        </div>
      </main>
    </Background>
  );
}