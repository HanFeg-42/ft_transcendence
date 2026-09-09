// PACOVA DESIGN SYSTEM

// Colors
// [ pink ][ green ][ purple ]

// Typography
// Heading
// Body
// Retro

// Buttons
// [ PLAY ]
// [ START ]
// [ CANCEL ]

// Inputs
// [ Username           ]

// Cards
// [ Player Card        ]

// Badges
// [ ONLINE ]

// Avatars
// [ 👤 ]

// Modal
// [ Example ]

// Toast
// [ Success message ]

// ...

import React from 'react';
import PixelButton from '../components/ui/PixelButton';

export default function App() {
  return (
    <main className="min-h-screen bg-pacova-bg text-white font-vt323 p-8 flex flex-col items-center justify-center gap-8">
      {/* En-tête avec typographie du Design System */}
      <header className="text-center space-y-2">
        <h1 className="text-5xl font-pixelify text-pacova-pink drop-shadow-[0_0_10px_#F32077]">
          PACOVA DESIGN SYSTEM
        </h1>
        <p className="text-xl text-gray-400">05. BOUTONS & ELEMENTS INTERACTIFS</p>
      </header>

      {/* Grille d'affichage principale */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        
        {/* Panneau Magenta */}
        <div className="bg-pacova-surface border-2 border-pacova-pink shadow-neon-pink pixel-corners p-6 flex flex-col items-center gap-4">
          <h2 className="text-2xl font-pixelify text-pacova-pink">VARIANTS MAGENTA</h2>
          
          <PixelButton variant="outline-magenta" onClick={() => alert('Start Game!')}>
            Outline Magenta
          </PixelButton>

          <PixelButton variant="filled-magenta">
            Filled Magenta
          </PixelButton>

          <PixelButton variant="solid-pink" size="lg">
            Solid Pink (LG)
          </PixelButton>
        </div>

        {/* Panneau Green & Status */}
        <div className="bg-pacova-surface border-2 border-pacova-green shadow-neon-green pixel-corners p-6 flex flex-col items-center gap-4">
          <h2 className="text-2xl font-pixelify text-pacova-green">VARIANTS GREEN & STATUS</h2>

          <PixelButton variant="filled-green">
            Filled Green
          </PixelButton>

          <PixelButton variant="olive-yellow">
            Olive Yellow
          </PixelButton>

          <div className="flex gap-4">
            <PixelButton variant="danger-red" size="sm">
              Quit
            </PixelButton>
            <PixelButton variant="warning-yellow" size="sm">
              Pause
            </PixelButton>
          </div>
        </div>

      </div>

      {/* État Désactivé */}
      <div className="flex items-center gap-4 pt-4">
        <span className="text-gray-500 font-pixelify text-xl">LOCKED STATE:</span>
        <PixelButton variant="outline-magenta" disabled>
          Locked
        </PixelButton>
      </div>
    </main>
  );
}


// import React from 'react';
// import PixelButton from '../components/ui/PixelButton';

// export default function App() {
//   return (
//     <div className="min-h-screen bg-[#0d0914] flex flex-col items-center justify-center gap-6 p-8">
//       {/* 1. Magenta Outline */}
//       <PixelButton variant="outline-magenta" onClick={() => alert('Start Game!')}>
//         Play Now
//       </PixelButton>

//       {/* 2. Neon Green Filled */}
//       <PixelButton variant="filled-green">
//         Play Now
//       </PixelButton>

//       {/* 3. Olive Yellow */}
//       <PixelButton variant="olive-yellow">
//         Play Now
//       </PixelButton>

//       {/* 4. Magenta Dark Filled */}
//       <PixelButton variant="filled-magenta">
//         Play Now
//       </PixelButton>

//       {/* 5. Solid Pink */}
//       <PixelButton variant="solid-pink" size="lg">
//         Play Now
//       </PixelButton>

//       {/* 6. Danger Red */}
//       <PixelButton variant="danger-red">
//         Quit Game
//       </PixelButton>

//       {/* 7. Warning Yellow */}
//       <PixelButton variant="warning-yellow">
//         Pause
//       </PixelButton>

//       {/* Disabled State */}
//       <PixelButton variant="outline-magenta" disabled>
//         Locked
//       </PixelButton>
//     </div>
//   );
// }