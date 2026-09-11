// import PixelButton from '../components/ui/PixelButton';
// import Input from '../components/ui/Input';
// import Card from '../components/ui/Card';

// export default function App() {
//   return (
//     <main className="min-h-screen bg-pacova-bg flex items-center justify-center p-6">
//       {/* Utilisation de la Card Rose */}
//       <Card variant="green" className="max-w-md w-full flex flex-col gap-4">
//         <h2 className="font-pixelify text-2xl text-pacova-pink uppercase">
//           CONNEXION
//         </h2>

//         {/* Champ Nom d'utilisateur */}
//         <Input 
//           label="PLAYER NAME" 
//           placeholder="ENTER YOUR NAME..." 
//         />

//         {/* Champ Mot de passe */}
//         <Input 
//           label="PASSWORD" 
//           type="password" 
//           placeholder="••••••••" 
//         />

//         {/* Bouton de validation */}
// <div className="flex w-full justify-center">
//   <PixelButton variant="solid-pink" className="mt-8">
//     START GAME
//   </PixelButton>
// </div>
//       </Card>
//     </main>
//   );
// }

// import React, { useState } from 'react';
// import PixelButton from '../components/ui/PixelButton';
// import Input from '../components/ui/Input';
// import Card from '../components/ui/Card';
// import Badge from '../components/ui/Badge';
// import Modal from '../components/ui/Modal';

// export default function DesignSystem() {
//   // État pour contrôler l'ouverture/fermeture de la Modal
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   return (
//     <main className="min-h-screen bg-pacova-bg text-white font-vt323 p-8 flex flex-col gap-10 items-center">
      
//       {/* Titre principal */}
//       <header className="text-center">
//         <h1 className="font-pixelify text-4xl text-pacova-pink drop-shadow-glow-pink uppercase">
//           PACOVA DESIGN SYSTEM SHOWCASE
//         </h1>
//         <p className="text-gray-400 text-xl mt-2">
//           Page de test récapitulative pour tous les composants
//         </p>
//       </header>

//       <div className="max-w-4xl w-full flex flex-col gap-8">
        
//         {/* SECTION 1: BADGES */}
//         <Card variant="pink">
//           <h2 className="font-pixelify text-xl text-pacova-pink mb-4">01. BADGES & STATUS</h2>
//           <div className="flex flex-wrap gap-4">
//             <Badge variant="pink">ONLINE</Badge>
//             <Badge variant="green">READY</Badge>
//             <Badge variant="yellow">PAUSED</Badge>
//             <Badge variant="red">OFFLINE</Badge>
//           </div>
//         </Card>

//         {/* SECTION 2: FORMULAIRE (INPUTS & BUTTONS) */}
//         <Card variant="green">
//           <h2 className="font-pixelify text-xl text-pacova-green mb-4">02. INPUTS & FORM</h2>
//           <div className="flex flex-col gap-4 max-w-md">
//             <Input label="PLAYER USERNAME" placeholder="Enter username..." />
//             <Input label="SECRET CODE" type="password" error="Invalid passkey!" />
//             <PixelButton variant="filled-green" className="mt-2">
//               SAVE DATA
//             </PixelButton>
//           </div>
//         </Card>

//         {/* SECTION 3: MODAL TEST */}
//         <Card variant="pink" className="flex flex-col items-start gap-4">
//           <h2 className="font-pixelify text-xl text-pacova-pink">03. POPUP MODAL</h2>
//           <p className="text-gray-300">
//             Cliquez sur le bouton ci-dessous pour tester l'ouverture de la fenêtre Modal.
//           </p>
//           <PixelButton variant="solid-pink" onClick={() => setIsModalOpen(true)}>
//             OPEN MODAL
//           </PixelButton>
//         </Card>

//       </div>

//       {/* Rendu de la Modal (S'affiche uniquement si isModalOpen === true) */}
//       <Modal 
//         isOpen={isModalOpen} 
//         onClose={() => setIsModalOpen(false)} 
//         title="SYSTEM ALERT"
//       >
//         <p>This is a reusable retro pixel modal dialog. You can place any content or text inside here!</p>
//       </Modal>

//     </main>
//   );
// }

// import React, { useState } from 'react';
// import Background from '../components/ui/Background';
// import Navbar from '../components/ui/Navbar';
// import GameModeCard from '../components/ui/GameModeCard';
// import PixelButton from '../components/ui/PixelButton';

// export default function SelectMode() {
//   const [selectedMode, setSelectedMode] = useState('LOCAL');

//   return (
//     <Background>
//       <Navbar activeTab="HOME" />

//       <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
//         {/* Titre de sélection */}
//         <div className="text-center">
//           <h1 className="font-press-start text-3xl text-pacova-pink drop-shadow-glow-pink mb-2">
//             SELECT MODE
//           </h1>
//           <p className="font-vt323 text-xl text-pacova-green">
//             ▼ CHOOSE YOUR GAME MODE ▼
//           </p>
//         </div>

//         {/* Grille des cartes de jeu */}
//         <div className="flex flex-wrap justify-center gap-6">
//           <GameModeCard
//             title="LOCAL"
//             description="Play with friends on the same screen"
//             icon="🟡"
//             selected={selectedMode === 'LOCAL'}
//             onClick={() => setSelectedMode('LOCAL')}
//           />
//           <GameModeCard
//             title="REMOTE"
//             description="Challenge players online worldwide"
//             icon="🌐"
//             selected={selectedMode === 'REMOTE'}
//             onClick={() => setSelectedMode('REMOTE')}
//           />
//           <GameModeCard
//             title="BOT"
//             description="Practice against artificial intelligence"
//             icon="👻"
//             selected={selectedMode === 'BOT'}
//             onClick={() => setSelectedMode('BOT')}
//           />
//         </div>

//         {/* Bouton de confirmation */}
//         <PixelButton variant="solid-pink" size="lg" className="mt-4">
//           CONTINUE
//         </PixelButton>
//       </main>
//     </Background>
//   );
// }










// import  { useState } from 'react';
// import Background from '../components/ui/Background';
// import Navbar from '../components/ui/Navbar';
// import Card from '../components/ui/Card';
// import PixelButton from '../components/ui/PixelButton';
// import Avatar from '../components/ui/Avatar';
// import Toast from '../components/ui/Toast';
// import GameUI, { type MatchRecord } from '../components/ui/GameUI';
// import Badge from '../components/ui/Badge';
// // import { ICONS, type IconName } from '../utils/icons';


// export default function DesignSystem() {
//   // État pour gérer la visibilité du Toast
//   const [showToast, setShowToast] = useState(true);
//   const [activeTab, setActiveTab] = useState('HOME');

//   // Données de démonstration pour le tableau de matchs
//   const mockMatches: MatchRecord[] = [
//     { id: '1', result: 'WIN', playerIcon: 'pacman', score: '8 - 3', opponent: 'ANON99', timeAgo: '2m ago' },
//     { id: '2', result: 'LOSS', playerIcon: 'ghost-red', score: '5 - 8', opponent: 'LUNA', timeAgo: '1h ago' },
//     { id: '3', result: 'WIN', playerIcon: 'ghost-cyan', score: '8 - 1', opponent: 'SLAYER', timeAgo: '2d ago' },
//   ];

//   return (
//     <Background>
//       {/* 1. COMPOSANT NAVBAR */}
//       <Navbar activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

//       <main className="max-w-6xl mx-auto p-8 w-full flex flex-col gap-8">
//         <header className="text-center mb-4">
//           <h1 className="font-press-start text-2xl text-pacova-pink drop-shadow-glow-pink">
//             PACOVA COMPONENT SHOWCASE
//           </h1>
//           <p className="font-vt323 text-xl text-gray-400 mt-2">
//             Aperçu visuel des 10+ composants réutilisables du Design System
//           </p>
//         </header>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
//           {/* 2. COMPOSANT AVATARS & BADGES */}
//           <Card variant="pink" className="flex flex-col gap-4">
//             <h2 className="font-pixelify text-xl text-pacova-pink border-b border-pacova-pink/30 pb-2">
//               01. AVATARS & STATUS
//             </h2>
//             <div className="flex items-center justify-around py-4">
//               <Avatar iconName="pacman" size="lg" status="online" />
//               <Avatar iconName="ghost-pink" size="md" status="busy" />
//               <Avatar iconName="ghost-cyan" size="sm" status="offline" />
//             </div>
//             <div className="flex flex-wrap gap-2 justify-center pt-2">
//               <Badge variant="pink">LEVEL 24</Badge>
//               <Badge variant="green">VIP PLAYER</Badge>
//               <Badge variant="yellow">RANK #1</Badge>
//             </div>
//           </Card>

//           {/* 3. COMPOSANT GAME UI (MATCH HISTORY) */}
//           <GameUI matches={mockMatches} />

//         </div>

//         {/* 4. CONTROLES D'INTERACTION TOAST */}
//         <Card variant="green" className="flex flex-col gap-4 items-start">
//           <h2 className="font-pixelify text-xl text-pacova-green border-b border-pacova-green/30 pb-2 w-full">
//             03. NOTIFICATIONS (TOAST)
//           </h2>
//           <p className="font-vt323 text-lg text-gray-300">
//             Cliquez ci-dessous pour déclencher à nouveau la notification d'alerte.
//           </p>
//           <PixelButton 
//             variant="filled-green" 
//             size="sm" 
//             onClick={() => setShowToast(true)}
//           >
//             TRIGGER TOAST
//           </PixelButton>
//         </Card>

//       </main>

//       {/* RENDER DU COMPOSANT TOAST (Si actif) */}
//       {showToast && (
//         <Toast 
//           message="SYSTEM ALERT: MATCH READY!" 
//           type="info" 
//           onClose={() => setShowToast(false)} 
//         />
//       )}
//     </Background>
//   );
// }