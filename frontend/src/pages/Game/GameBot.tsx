import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createGame, applyInput, tick } from '../../engine/engine';
import { DEFAULT_MAZE_ID, MAZES, findSpawn } from '../../engine/maze';
import { chooseDirection } from '../../ai/bot';
import type { BotDifficulty } from '../../ai/bot';
import type { GameState, Direction } from '../../../../shared/types/game-types';
// Same UI pieces as the local game page (GamePage.tsx)
import MazeUI from '../../components/game/MazeUI';
import HudTop from '../../components/game/HudTop';
import HudPlayer from '../../components/game/HudPlayer';
import MobileControls from '../../components/game/MobileControls';
import { RotDev } from '../../components/game/RotateDevice';
import PixelButton from '../../components/ui/PixelButton';
import { useKeyboard } from '../../hooks/useKeyboard';
import styles from './GamePage.module.css';
import Background from '../../components/ui/Background';
import ghostImg from '../../assets/icons/ghost.png';

const TICK_INTERVAL_MS = 1000 / 30;
const MATCH_TIME = 360; // seconds
const CENTER_OFFSET = 4;
const HUMAN_ID = 'player-1';
const BOT_ID = 'ai';

// Same setup as BotTest: human on the left of the spawn, bot on the right.
function createBotGame(mazeId: string): GameState {
    const state = createGame(HUMAN_ID, MATCH_TIME, mazeId);
    const spawn = findSpawn(MAZES[state.mazeId]);

    state.players[0].spawn = { x: spawn.x - CENTER_OFFSET, y: spawn.y };
    state.players[0].tile = { x: spawn.x - CENTER_OFFSET, y: spawn.y };

    state.players.push({
        id: BOT_ID,
        spawn: { x: spawn.x + CENTER_OFFSET, y: spawn.y },
        tile: { x: spawn.x + CENTER_OFFSET, y: spawn.y },
        dir: null,
        nextDir: null,
        step: 0,
        lives: 3,
        score: 0,
        pelletsEaten: 0,
        ghostsEaten: 0,
        connected: true,
        joinedAt: Date.now(),
    });

    return state;
}

// Same winner rules as BotTest / backend.
function finishLocalMatch(state: GameState): void {
    const [human, bot] = state.players;
    if (!human || !bot) return;

    if (bot.lives <= 0 && human.lives > 0) state.winnerId = human.id;
    else if (human.lives <= 0 && bot.lives > 0) state.winnerId = bot.id;
    else if (human.score > bot.score) state.winnerId = human.id;
    else if (bot.score > human.score) state.winnerId = bot.id;
    else state.winnerId = undefined;

    state.status = 'finished';
}

// Styled card + custom styled list (a native <select> list can't be styled).
const Picker: React.FC<{
    icon: React.ReactNode; label: string; value: string;
    options: string[]; onChange: (v: string) => void;
    format?: (v: string) => string; // i18n: how to display a value (value itself stays English)
}> = ({ icon, label, value, options, onChange, format = (v) => v }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative w-80" tabIndex={0} onBlur={() => setOpen(false)}>
            <div
                onClick={() => setOpen(!open)}
                className="flex items-center gap-4 px-4 py-3 bg-black/60 border-2 border-pacova-green rounded-xl cursor-pointer hover:shadow-[0_0_12px_#8ED603]"
            >
                <span className="text-3xl">{icon}</span>
                <div className="flex-1 border-s border-pacova-green/40 ps-4">
                    <p className="font-vt323 text-sm text-pacova-green tracking-widest">{label}</p>
                    <p className="font-pixelify text-2xl text-pacova-pink uppercase">{format(value)}</p>
                </div>
                <span className="text-pacova-green">{open ? '▲' : '▼'}</span>
            </div>
            {open && (
                <ul className="absolute z-30 w-full mt-1 bg-black/90 border-2 border-pacova-green rounded-xl overflow-hidden">
                    {options.map((o) => (
                        <li
                            key={o}
                            onMouseDown={() => { onChange(o); setOpen(false); }}
                            className={`px-4 py-2 font-pixelify text-xl uppercase cursor-pointer hover:bg-pacova-green hover:text-black ${
                                o === value ? 'text-pacova-pink' : 'text-pacova-green'
                            }`}
                        >
                            {format(o)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// One side of the result: name, score, hearts left. The winner shines green.
const Result: React.FC<{ name: string; score: number; lives: number; win: boolean }> = ({ name, score, lives, win }) => (
    <div className={`flex-1 p-3 rounded-xl border-2 text-center bg-pacova-purple/40 ${
        win ? 'border-pacova-green shadow-neon-green' : 'border-white/20 opacity-70'
    }`}>
        <p className={`font-press-start text-sm ${win ? 'text-pacova-green drop-shadow-glow-green' : 'text-white/60'}`}>{name}</p>
        <p className="font-pixelify text-4xl text-white my-2">{score}</p>
        <p className="text-2xl">
            {[0, 1, 2].map((i) => (
                <span key={i} className={i < lives ? 'text-pacova-pink drop-shadow-glow-pink' : 'text-white/20'}>♥</span>
            ))}
        </p>
    </div>
);

const BotSession: React.FC<{ mazeId: string; difficulty: BotDifficulty }> = ({ mazeId, difficulty }) => {
    const { t } = useTranslation();
    const stateRef = useRef<GameState>(createBotGame(mazeId));
    const [, setFrame] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const state = stateRef.current;
            if (state.status !== 'playing') return;

            // The bot only decides at tile centers.
            const bot = state.players.find((p) => p.id === BOT_ID);
            if (bot && bot.step === 0) {
                const dir = chooseDirection(state, BOT_ID, difficulty);
                if (dir) applyInput(state, BOT_ID, dir);
            }

            tick(state);

            // Engine ends with "won"/"lost" -> convert to the 2-player "finished".
            if (state.status !== 'playing') finishLocalMatch(state);

            setFrame((f) => f + 1);
        }, TICK_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [difficulty]);

    const sendInput = (dir: Direction) => {
        const state = stateRef.current;
        if (state.status !== 'playing') return;
        applyInput(state, HUMAN_ID, dir);
    };

    // Human can use arrows or WASD.
    useKeyboard(sendInput, 'arrows');
    useKeyboard(sendInput, 'wasd');

    const state = stateRef.current;
    const [human, bot] = state.players;

    const won = state.winnerId === HUMAN_ID;
    const lost = state.winnerId === BOT_ID;
    const title = won ? t('bot_youWin') : lost ? t('bot_botWins') : t('bot_draw');
    const titleColor = won ? 'text-pacova-green drop-shadow-glow-green' : 'text-pacova-pink drop-shadow-glow-pink';

    return (
        <>
            <RotDev />
            {state.status === 'playing' && <MobileControls onInput={sendInput} />}

            <div className={styles.page}>
                <div className={styles.topBar}>
                    <HudTop state={state} />
                </div>

                <div className={styles.leftBar}>
                    <HudPlayer player={human} />
                </div>

                <div className={styles.mazeWrapper}>
                    <MazeUI state={state} mazeId={mazeId} />
                </div>

                <div className={styles.rightBar}>
                    <HudPlayer player={bot} />
                </div>
            </div>

            {state.status !== 'playing' && (
                <div className="fixed inset-0 z-[99] bg-black/80 flex items-center justify-center">
                    <div className="w-[28rem] max-w-[92vw] p-6 flex flex-col items-center gap-5 bg-pacova-surface border-4 border-pacova-pink rounded-2xl shadow-neon-pink">
                        <h1 className={`font-press-start text-3xl ${titleColor}`}>{title}</h1>
                        <div className="flex gap-4 w-full">
                            <Result name={t('bot_you')} score={human.score} lives={human.lives} win={won} />
                            <Result name={t('bot_bot')} score={bot.score} lives={bot.lives} win={lost} />
                        </div>
                        <p className="font-vt323 text-xl text-white/70">{t('bot_time', { time: fmt(MATCH_TIME - state.timeRemaining) })}</p>
                        <div className="flex gap-6">
                            <PixelButton variant="outline-green" size="md" onClick={() => window.location.reload()}>
                                {t('bot_restart')}
                            </PixelButton>
                            <a href="/home" className="inline-flex">
                                <PixelButton variant="danger-red" size="md">{t('bot_quit')}</PixelButton>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const BotPage: React.FC = () => {
    const { t } = useTranslation();
    const [mazeId, setMazeId] = useState<string>(DEFAULT_MAZE_ID);
    const [difficulty, setDifficulty] = useState<BotDifficulty>('hard');
    const [started, setStarted] = useState(false);

    const navigate = useNavigate();

    if (!started) {
        return (
            <Background>
                <div className="flex-1 flex flex-col items-center justify-center gap-5">
                    <RotDev />
                    <p className="font-vt323 text-3xl text-pacova-green">{t('bot_chooseTitle')}</p>

                    <Picker icon="🗺️" label={t('bot_map')} value={mazeId} options={Object.keys(MAZES)} onChange={setMazeId} />
                    <Picker
                        icon={<img src={ghostImg} alt="" className="w-8 h-8" />}
                        label={t('bot_level')}
                        value={difficulty}
                        options={['easy', 'normal', 'hard']}
                        onChange={(v) => setDifficulty(v as BotDifficulty)}
                        format={(d) => t(`bot_${d}`)}
                    />

                    <div className="flex gap-4 mt-2">
                        <PixelButton variant="danger-red" size="md" onClick={() => navigate('/home')}>
                            {t('bot_home')}
                        </PixelButton>
                        <PixelButton variant="filled-green" size="md" onClick={() => setStarted(true)}>
                            {t('bot_start')}
                        </PixelButton>
                    </div>
                </div>
            </Background>
        );
    }

    return <BotSession mazeId={mazeId} difficulty={difficulty} />;
};

export default BotPage;