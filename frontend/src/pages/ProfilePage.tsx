import React, { useState } from 'react';
import Background from '../components/ui/Background';
import Navbar from '../components/ui/Navbar';
import ProfileCard from '../components/ui/ProfileCard';
import GameUI from '../components/ui/GameUI';
import Card from '../components/ui/Card';
import Achievements from '../components/ui/Achievements';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('PROFILE');

  return (
    <Background>
      <Navbar activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-start justify-center gap-6">
        
        {/* COLONNE GAUCHE : CARTE PROFIL */}
        <div className="w-full lg:w-auto flex justify-center shrink-0">
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

        {/* COLONNE DROITE : MATCH HISTORY + RANK + ACHIEVEMENTS */}
        <div className="w-full lg:flex-1 flex flex-col gap-6">
          
          {/* Ligne Haut : Match History & Current Rank */}
          <div className="flex flex-col xl:flex-row gap-6 items-start">
            <div className="w-full xl:flex-1">
              <GameUI />
            </div>

            {/* Carte Rank */}
            <Card variant="pink" className="w-full xl:w-64 shrink-0 flex flex-col items-center text-center p-4">
              <span className="font-pixelify text-[10px] text-pacova-pink uppercase tracking-widest self-start mb-2">
                CURRENT RANK
              </span>
              <div className="text-6xl my-2 drop-shadow-glow-pink select-none">💎</div>
              <h3 className="font-pixelify text-xl text-pacova-green">DIAMOND II</h3>
              <div className="text-yellow-400 text-xs my-1">★★★★☆</div>
              <span className="font-vt323 text-xs text-gray-400 mb-3">TOP 12% OF PLAYERS</span>
              
              <div className="w-full h-2 bg-gray-900 border border-pacova-green/40 rounded-full overflow-hidden p-0.5">
                <div className="h-full bg-pacova-green rounded-full w-[12%] shadow-neon-green" />
              </div>
              <span className="font-vt323 text-xs text-gray-400 mt-1 self-end">12%</span>
            </Card>
          </div>

          {/* Ligne Bas : Achievements */}
          <Achievements />

        </div>
      </main>
    </Background>
  );
}