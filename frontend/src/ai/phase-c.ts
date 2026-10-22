// import { createGame, applyInput, tick } from "../engine/engine";
// import { chooseDirection } from "./bot";
// import { MAZES } from "../engine/maze";
// import { stats } from "./danger";

// const GAMES = 30;

// for (const map of Object.keys(MAZES)) {
//   let wins = 0, deaths = 0, longestNoPellet = 0;
//   stats.threatsCalls = 0;
//   stats.threatsFound = 0;
//   stats.escapeCalls = 0;

//   for (let g = 0; g < GAMES; g++) {
//     let state = createGame("local", 360, map);
//     let guard = 0;
//     let sincePellet = 0;
//     let prevScore = state.players[0].score;

//     while (state.status === "playing" && guard < 10000) {
//       const p = state.players[0];
//       if (p.step === 0) {
//         const dir = chooseDirection(state, p.id);
//         if (dir) applyInput(state, p.id, dir);
//       }
//       tick(state);
//       guard++;

//       if (p.score > prevScore) sincePellet = 0;
//       else sincePellet++;
//       longestNoPellet = Math.max(longestNoPellet, sincePellet);
//       prevScore = p.score;
//     }

//     if (state.status === "won") wins++;
//     else deaths++;
//   }

//   console.log(`${map}: ${wins}W / ${deaths}L / longest no-pellet: ${longestNoPellet} ticks`);
//   console.log(
//     `threatsCalls=${stats.threatsCalls} threatsFound=${stats.threatsFound} escapeCalls=${stats.escapeCalls}`,
//   );
// }
