import React, { useState, useRef } from 'react';
import {
  Shield,
  Play,
  RotateCcw,
  ShoppingBag,
  Package,
  Award,
  Calendar,
  CheckCircle2,
  Trophy,
  Sliders,
  Sparkles,
  Flame,
  Globe2,
  MapPin,
  Clock,
  ArrowRight,
  User,
  Zap,
} from 'lucide-react';
import { MapId, GameMode } from '../game/types';
import {
  PlayerData,
  STORE_CATALOG,
  DAILY_LOGIN_REWARDS,
  StoreItem,
} from '../game/state/PlayerProgress';

interface MainLobbyProps {
  playerData: PlayerData;
  onStartMatch: (mode: GameMode, mapId: MapId) => void;
  onSelectMap: (mapId: MapId) => void;
  onSelectMode: (mode: GameMode) => void;
  onBuyItem: (item: StoreItem) => void;
  onEquipItem: (item: StoreItem) => void;
  onClaimDailyLogin: (day: number) => void;
  onClaimMission: (missionId: string) => void;
  onClaimPassTier: (tier: number) => void;
  onRotateCharacterPreview: (deltaX: number) => void;
  onOpenSettings: () => void;
}

type LobbyTab = 'lobby' | 'maps' | 'vault' | 'store' | 'pass' | 'missions' | 'events' | 'ranked';

export const MainLobby: React.FC<MainLobbyProps> = ({
  playerData,
  onStartMatch,
  onSelectMap,
  onSelectMode,
  onBuyItem,
  onEquipItem,
  onClaimDailyLogin,
  onClaimMission,
  onClaimPassTier,
  onRotateCharacterPreview,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<LobbyTab>('lobby');
  const [notification, setNotification] = useState<string | null>(null);
  const [storeCategory, setStoreCategory] = useState<'outfit' | 'weapon' | 'backpack' | 'avatar'>('outfit');

  const dragStartRef = useRef<number | null>(null);
  const isMouseDownRef = useRef<boolean>(false);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Drag handler for rotating character preview in lobby
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && activeTab === 'lobby') {
      // Rotation logic handled via onRotateCharacterPreview
    }
  };

  const mapDetails = [
    {
      id: 'india' as MapId,
      name: 'India: Heritage Island',
      badge: 'FEATURED MAP',
      desc: 'Inspired by Indian heritage. Explore the grand Marble Citadel (Taj monument), ancient sandstone fort ramparts, and village spice bazaars.',
      accent: 'from-amber-600 to-rose-700',
      tag: 'Grand Palaces · Banyan Groves',
    },
    {
      id: 'rajasthan' as MapId,
      name: 'Rajasthan: Desert Kingdom',
      badge: 'POPULAR',
      desc: 'Blazing desert terrain. Infiltrate the multi-tiered Amber Palace (Hawa monument), ancient geometric stepwell, and desert canyon forts.',
      accent: 'from-orange-600 to-amber-700',
      tag: 'Rolling Dunes · Stepwells',
    },
    {
      id: 'frontier' as MapId,
      name: 'Frontier Island',
      badge: 'TACTICAL',
      desc: 'Modern coastal battleground. Battle across Radar Alpha hilltop, concrete Bunker 04, shipping container harbour, and dropship crash site.',
      accent: 'from-cyan-600 to-blue-800',
      tag: 'Radar Mast · Harbours',
    },
  ];

  return (
    <div className="absolute inset-0 pointer-events-auto select-none z-30 flex flex-col justify-between p-3 sm:p-5 text-slate-100 overflow-hidden">
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 border border-cyan-400 text-cyan-200 text-xs font-mono font-bold shadow-2xl animate-in fade-in slide-in-from-top-2">
          {notification}
        </div>
      )}

      {/* TOP BAR: Player Profile, Currencies, and System Icons */}
      <div className="flex items-center justify-between gap-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 p-2.5 rounded-2xl shadow-xl">
        {/* Profile Card */}
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-800 border-2 border-cyan-300 flex items-center justify-center shadow-lg">
            <User className="w-6 h-6 text-white" />
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black font-mono">
              Lv.{playerData.level}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">
                {playerData.displayName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold uppercase">
                {playerData.rank} ({playerData.rankPoints} RP)
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Matches: {playerData.totalMatches} · Wins: {playerData.totalWins} · Kills: {playerData.totalKills}
            </div>
          </div>
        </div>

        {/* Currency Badges */}
        <div className="flex items-center gap-3">
          {/* Aegis Credits (Soft Currency) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 shadow-inner">
            <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 font-black text-[9px]">
              C
            </div>
            <span className="font-mono font-bold text-amber-300 text-xs">
              {playerData.credits.toLocaleString()}
            </span>
          </div>

          {/* Battle Diamonds (Premium Tokens) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono font-bold text-cyan-300 text-xs">
              {playerData.diamonds.toLocaleString()}
            </span>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER AREA: MODAL DRAWERS OR LOBBY HERO STAGE */}
      <div className="flex-1 my-2 overflow-y-auto relative flex items-center justify-center">
        {/* --- TAB: LOBBY HERO VIEW (3D Character Showcase & Drag Rotation) --- */}
        {activeTab === 'lobby' && (
          <div
            className="w-full h-full flex flex-col justify-between items-center relative pointer-events-auto touch-none select-none cursor-grab active:cursor-grabbing"
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                dragStartRef.current = e.touches[0].clientX;
              }
            }}
            onTouchMove={(e) => {
              if (dragStartRef.current !== null && e.touches.length === 1) {
                const deltaX = e.touches[0].clientX - dragStartRef.current;
                dragStartRef.current = e.touches[0].clientX;
                onRotateCharacterPreview(deltaX);
              }
            }}
            onTouchEnd={() => {
              dragStartRef.current = null;
            }}
            onMouseDown={(e) => {
              isMouseDownRef.current = true;
              dragStartRef.current = e.clientX;
            }}
            onMouseMove={(e) => {
              if (isMouseDownRef.current && dragStartRef.current !== null) {
                const deltaX = e.clientX - dragStartRef.current;
                dragStartRef.current = e.clientX;
                onRotateCharacterPreview(deltaX);
              }
            }}
            onMouseUp={() => {
              isMouseDownRef.current = false;
              dragStartRef.current = null;
            }}
            onMouseLeave={() => {
              isMouseDownRef.current = false;
              dragStartRef.current = null;
            }}
          >
            {/* Top Interactive Prompt Badge */}
            <div className="mt-3 px-3.5 py-1.5 rounded-full bg-slate-900/85 border border-cyan-500/40 backdrop-blur-md text-[11px] font-mono text-cyan-300 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] pointer-events-none animate-in fade-in">
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span>SWIPE / DRAG TO ROTATE 3D OPERATOR</span>
            </div>

            {/* Bottom Equipment Telemetry */}
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2 pointer-events-none">
              <div className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300 backdrop-blur-md shadow-md">
                OUTFIT: <strong className="text-amber-300 uppercase">{playerData.equippedOutfit.replace('outfit_', '').replace('_', ' ')}</strong>
              </div>
              <div className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300 backdrop-blur-md shadow-md">
                ARMAMENT: <strong className="text-cyan-300 uppercase">{playerData.equippedWeaponWrap.replace('wrap_', '').replace('_', ' ')}</strong>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: MAP SELECTOR --- */}
        {activeTab === 'maps' && (
          <div className="w-full max-w-4xl p-4 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold uppercase font-mono tracking-wider text-cyan-300 flex items-center gap-2">
                <Globe2 className="w-5 h-5" /> Select Battleground Island
              </h2>
              <button
                onClick={() => setActiveTab('lobby')}
                className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {mapDetails.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelectMap(m.id);
                    showToast(`Selected Map: ${m.name}`);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    playerData.selectedMap === m.id
                      ? 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-2 ring-cyan-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {m.badge}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{m.tag}</span>
                    </div>
                    <h3 className="font-bold text-sm text-white mb-1.5">{m.name}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{m.desc}</p>
                  </div>

                  <button
                    className={`mt-4 w-full py-2 rounded-lg font-mono font-bold text-xs uppercase tracking-wider ${
                      playerData.selectedMap === m.id
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {playerData.selectedMap === m.id ? 'SELECTED' : 'SELECT MAP'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: VAULT / INVENTORY --- */}
        {activeTab === 'vault' && (
          <div className="w-full max-w-4xl p-4 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold uppercase font-mono tracking-wider text-cyan-300 flex items-center gap-2">
                <Package className="w-5 h-5" /> Tactical Vault & Outfits
              </h2>
              <button
                onClick={() => setActiveTab('lobby')}
                className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STORE_CATALOG.filter((item) => playerData.ownedItemIds.includes(item.id)).map((item) => {
                const isEquipped =
                  playerData.equippedOutfit === item.id ||
                  playerData.equippedWeaponWrap === item.id ||
                  playerData.equippedBackpack === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between ${
                      isEquipped ? 'bg-slate-900 border-cyan-400 shadow-md' : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div
                        className="w-full h-18 rounded-lg mb-2 flex items-center justify-center border border-white/10"
                        style={{ backgroundColor: item.previewColor }}
                      >
                        <Shield className="w-8 h-8 text-white/80" />
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                        {item.category}
                      </span>
                      <h4 className="font-bold text-xs text-white truncate">{item.name}</h4>
                    </div>

                    <button
                      onClick={() => {
                        onEquipItem(item);
                        showToast(`Equipped: ${item.name}`);
                      }}
                      className={`mt-3 w-full py-1.5 rounded-lg font-mono text-[11px] font-bold uppercase ${
                        isEquipped ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB: STORE --- */}
        {activeTab === 'store' && (
          <div className="w-full max-w-4xl p-4 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold uppercase font-mono tracking-wider text-amber-400 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Tactical Supply Store
              </h2>
              <div className="flex items-center gap-2">
                {(['outfit', 'weapon', 'backpack', 'avatar'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setStoreCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase font-bold ${
                      storeCategory === cat ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                <button
                  onClick={() => setActiveTab('lobby')}
                  className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto">
              {STORE_CATALOG.filter((i) => i.category === storeCategory).map((item) => {
                const isOwned = playerData.ownedItemIds.includes(item.id);

                return (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div
                        className="w-full h-18 rounded-lg mb-2 flex items-center justify-center border border-white/10"
                        style={{ backgroundColor: item.previewColor }}
                      >
                        <Shield className="w-8 h-8 text-white/80" />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-amber-400 uppercase">
                        {item.rarity} · {item.category}
                      </span>
                      <h4 className="font-bold text-xs text-white truncate">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>
                    </div>

                    <button
                      disabled={isOwned}
                      onClick={() => onBuyItem(item)}
                      className={`mt-3 w-full py-1.5 rounded-lg font-mono text-[11px] font-bold uppercase flex items-center justify-center gap-1 ${
                        isOwned
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {isOwned ? 'OWNED' : `${item.priceCredits} CREDITS`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB: BATTLE PASS --- */}
        {activeTab === 'pass' && (
          <div className="w-full max-w-4xl p-4 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold uppercase font-mono tracking-wider text-amber-400 flex items-center gap-2">
                  <Award className="w-5 h-5" /> Aegis Pass: Season 1 — Rising Horizon
                </h2>
                <div className="text-xs text-slate-400 font-mono">
                  Season ends in 24 Days · Current Tier: {playerData.passTier} / 20
                </div>
              </div>
              <button
                onClick={() => setActiveTab('lobby')}
                className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                Close
              </button>
            </div>

            {/* Pass Track Tiers */}
            <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const tierNum = idx + 1;
                const isUnlocked = playerData.passTier >= tierNum;
                const isClaimed = playerData.claimedPassTiers.includes(tierNum);

                return (
                  <div
                    key={tierNum}
                    className={`min-w-[120px] p-3 rounded-xl border flex flex-col justify-between items-center text-center ${
                      isUnlocked ? 'bg-slate-900 border-amber-500/60' : 'bg-slate-950 border-slate-800 opacity-60'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-amber-400">TIER {tierNum}</span>
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-amber-500/30 flex items-center justify-center my-2">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                    <span className="text-[10px] text-slate-300 font-mono">+{150 + tierNum * 50} Credits</span>

                    <button
                      disabled={!isUnlocked || isClaimed}
                      onClick={() => onClaimPassTier(tierNum)}
                      className={`mt-2 w-full py-1 rounded text-[10px] font-mono font-bold uppercase ${
                        isClaimed
                          ? 'bg-slate-800 text-slate-500'
                          : isUnlocked
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      {isClaimed ? 'CLAIMED' : isUnlocked ? 'CLAIM' : 'LOCKED'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB: DAILY MISSIONS --- */}
        {activeTab === 'missions' && (
          <div className="w-full max-w-4xl p-4 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold uppercase font-mono tracking-wider text-cyan-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Daily Combat Missions
              </h2>
              <button
                onClick={() => setActiveTab('lobby')}
                className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {playerData.missions.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-white">{m.title}</h4>
                    <p className="text-[11px] text-slate-400">{m.desc}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-40 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 transition-all"
                          style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-300">
                        {m.current} / {m.target}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-amber-400">+{m.rewardCredits} C</div>
                      <div className="text-[10px] font-mono text-cyan-300">+{m.rewardXp} XP</div>
                    </div>

                    <button
                      disabled={!m.completed || m.claimed}
                      onClick={() => onClaimMission(m.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase ${
                        m.claimed
                          ? 'bg-slate-800 text-slate-500'
                          : m.completed
                          ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                          : 'bg-slate-800 text-slate-600'
                      }`}
                    >
                      {m.claimed ? 'CLAIMED' : m.completed ? 'CLAIM' : 'IN PROGRESS'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: EVENTS & LOGIN CALENDAR --- */}
        {activeTab === 'events' && (
          <div className="w-full max-w-4xl p-4 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold uppercase font-mono tracking-wider text-amber-400 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> 7-Day Recruit Login Calendar
              </h2>
              <button
                onClick={() => setActiveTab('lobby')}
                className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {DAILY_LOGIN_REWARDS.map((r) => {
                const isClaimed = playerData.claimedLoginDays.includes(r.day);
                const canClaim = !isClaimed;

                return (
                  <div
                    key={r.day}
                    className={`p-3 rounded-xl border flex flex-col justify-between text-center items-center ${
                      isClaimed
                        ? 'bg-slate-950 border-slate-800 opacity-60'
                        : 'bg-slate-900 border-amber-500/60 shadow-lg'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold text-amber-300">DAY {r.day}</span>
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-amber-400/30 flex items-center justify-center my-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-[10px] text-white font-mono font-bold">{r.rewardText}</span>

                    <button
                      disabled={isClaimed}
                      onClick={() => onClaimDailyLogin(r.day)}
                      className={`mt-2 w-full py-1 rounded text-[10px] font-mono font-bold uppercase ${
                        isClaimed ? 'bg-slate-800 text-slate-500' : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      }`}
                    >
                      {isClaimed ? 'CLAIMED' : 'CLAIM'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB: RANKED LEADERBOARD --- */}
        {activeTab === 'ranked' && (
          <div className="w-full max-w-4xl p-4 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold uppercase font-mono tracking-wider text-amber-400 flex items-center gap-2">
                <Trophy className="w-5 h-5" /> Competitive Apex Ladder
              </h2>
              <button
                onClick={() => setActiveTab('lobby')}
                className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {[
                { pos: 1, name: 'Aegis_Viper', rank: 'Legend', rp: 3450, winRate: '68%' },
                { pos: 2, name: 'Rajput_King', rank: 'Legend', rp: 3280, winRate: '62%' },
                { pos: 3, name: 'Falcon_Strike', rank: 'Master', rp: 2920, winRate: '58%' },
                { pos: 4, name: 'Dune_Ghost', rank: 'Diamond', rp: 2340, winRate: '51%' },
                { pos: 5, name: playerData.displayName, rank: playerData.rank, rp: playerData.rankPoints, winRate: '48%' },
              ].map((entry) => (
                <div
                  key={entry.pos}
                  className={`p-2.5 rounded-xl border flex items-center justify-between font-mono text-xs ${
                    entry.name === playerData.displayName
                      ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-bold text-center text-amber-400">#{entry.pos}</span>
                    <span className="font-bold text-white">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold uppercase text-[10px]">
                      {entry.rank}
                    </span>
                    <span>{entry.rp} RP</span>
                    <span className="text-slate-400">{entry.winRate} Win</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS & START BUTTON DOCK */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-2xl">
        {/* Navigation Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'lobby', label: 'LOBBY', icon: Shield },
            { id: 'maps', label: 'MAPS', icon: Globe2 },
            { id: 'vault', label: 'VAULT', icon: Package },
            { id: 'store', label: 'STORE', icon: ShoppingBag },
            { id: 'pass', label: 'PASS', icon: Award },
            { id: 'missions', label: 'MISSIONS', icon: CheckCircle2 },
            { id: 'events', label: 'EVENTS', icon: Calendar },
            { id: 'ranked', label: 'RANKS', icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LobbyTab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Map & START MATCH CTA */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Quick Mode & Map indicator button */}
          <button
            onClick={() => setActiveTab('maps')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-left hover:border-cyan-400 transition-colors"
          >
            <MapPin className="w-4 h-4 text-cyan-400" />
            <div className="text-[10px] font-mono">
              <div className="text-slate-400 uppercase">MAP:</div>
              <div className="font-bold text-white uppercase">{playerData.selectedMap}</div>
            </div>
          </button>

          {/* Big Tactile Start Button */}
          <button
            onClick={() => onStartMatch(playerData.selectedMode, playerData.selectedMap)}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-black font-mono text-sm tracking-widest uppercase shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>START MATCH</span>
          </button>
        </div>
      </div>
    </div>
  );
};
