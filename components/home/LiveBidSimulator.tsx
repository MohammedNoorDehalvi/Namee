'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Radio, RefreshCw, Sparkles, Trophy, Zap, ShieldCheck } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { BorderBeam } from '@/components/ui/BorderBeam';
import { AnimatedBeam } from '@/components/ui/AnimatedBeam';
import { Confetti } from '@/components/ui/Confetti';

interface TeamConfig {
  id: string;
  name: string;
  logoUrl: string;
  captain: string;
  color: string;
}

const DEMO_TEAMS: TeamConfig[] = [
  {
    id: 'bagicha',
    name: 'Bagicha Blasters',
    logoUrl: 'https://scontent.fidr2-1.fna.fbcdn.net/v/t1.15752-9/739117948_866784456079639_2219252502290298034_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=9f807c&_nc_ohc=5HPIZgXydycQ7kNvwEE0vnn&_nc_oc=AdrGNuUQf-Vn98KPwCF_O84D0ZMildKgddfQ9Vo4BrCWLe1EBMSkD24EaP9RtiARKFg&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.fidr2-1.fna&_nc_ss=7a22e&oh=03_Q7cD5wGfJJNCkLYyV5S8Z1SdZ_birGrxTrQ0ZYKPCcuhF862KA&oe=6A71CC2B',
    captain: 'Bagicha (Captain)',
    color: 'from-amber-500 to-red-600',
  },
  {
    id: 'naved',
    name: 'Naved Titans',
    logoUrl: 'https://hloojwrlqemyrdxwsuzz.supabase.co/storage/v1/object/public/apl-assets/team-logos/1779171793424-47473de7-2b4d-4a88-a458-74a8c78b3b00.webp',
    captain: 'Naved (Captain)',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'arham',
    name: 'Arham Night Riders',
    logoUrl: 'https://hloojwrlqemyrdxwsuzz.supabase.co/storage/v1/object/public/apl-assets/team-logos/1779430001771-45bdda0a-266e-4f44-b295-9eb0d588e110.webp',
    captain: 'Arham (Captain)',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'faiz',
    name: 'Faiz Blasters',
    logoUrl: 'https://hloojwrlqemyrdxwsuzz.supabase.co/storage/v1/object/public/apl-assets/team-logos/1779171720315-4cb153b3-de07-41d7-93ea-d43d9b1884d7.webp',
    captain: 'Faiz (Captain)',
    color: 'from-emerald-500 to-teal-600',
  },
];

const INITIAL_PLAYER = {
  name: 'Kabir',
  photoUrl: 'https://hloojwrlqemyrdxwsuzz.supabase.co/storage/v1/object/public/player-photos/players/1779299886514-87650c19-f1c0-49db-8897-3bbaebf255cf.webp',
  role: 'Batter / All-Rounder',
  basePrice: 2000,
};

interface Bid {
  id: string;
  teamId: string;
  team: string;
  logoUrl: string;
  amount: number;
  time: string;
  captain: string;
  color: string;
}

const createInitialBids = (): Bid[] => [
  {
    id: '1',
    teamId: 'faiz',
    team: 'Faiz Blasters',
    logoUrl: DEMO_TEAMS[3].logoUrl,
    amount: 2000,
    time: '10:42:01',
    captain: 'Faiz (Captain)',
    color: DEMO_TEAMS[3].color,
  },
  {
    id: '2',
    teamId: 'arham',
    team: 'Arham Night Riders',
    logoUrl: DEMO_TEAMS[2].logoUrl,
    amount: 3000,
    time: '10:42:08',
    captain: 'Arham (Captain)',
    color: DEMO_TEAMS[2].color,
  },
  {
    id: '3',
    teamId: 'naved',
    team: 'Naved Titans',
    logoUrl: DEMO_TEAMS[1].logoUrl,
    amount: 4000,
    time: '10:42:15',
    captain: 'Naved (Captain)',
    color: DEMO_TEAMS[1].color,
  },
  {
    id: '4',
    teamId: 'bagicha',
    team: 'Bagicha Blasters',
    logoUrl: DEMO_TEAMS[0].logoUrl,
    amount: 5000,
    time: '10:42:22',
    captain: 'Bagicha (Captain)',
    color: DEMO_TEAMS[0].color,
  },
];

const INITIAL_TEAM_BUDGETS: Record<string, number> = {
  bagicha: 45000,
  naved: 46000,
  arham: 47000,
  faiz: 48000,
};

export function LiveBidSimulator() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('bagicha');
  const [bids, setBids] = useState<Bid[]>(createInitialBids());
  const [currentAmount, setCurrentAmount] = useState<number>(5000);
  const [teamBudgets, setTeamBudgets] = useState<Record<string, number>>(INITIAL_TEAM_BUDGETS);
  const [isSold, setIsSold] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const activeTeam = DEMO_TEAMS.find((t) => t.id === selectedTeamId) || DEMO_TEAMS[0];
  const userBudget = teamBudgets[selectedTeamId] ?? 50000;

  const handleUserBid = () => {
    if (isSold) return;
    const increment = 1000;
    const nextAmount = currentAmount + increment;
    if (userBudget < increment) return;

    const newBid: Bid = {
      id: Date.now().toString(),
      teamId: activeTeam.id,
      team: activeTeam.name,
      logoUrl: activeTeam.logoUrl,
      amount: nextAmount,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      captain: `${activeTeam.captain} (YOU)`,
      color: activeTeam.color,
    };

    setBids((prev) => [newBid, ...prev]);
    setCurrentAmount(nextAmount);
    setTeamBudgets((prev) => ({
      ...prev,
      [activeTeam.id]: Math.max(0, (prev[activeTeam.id] ?? 50000) - increment),
    }));

    // Trigger celebration when bid reaches milestone
    if (nextAmount >= 12000) {
      setShowConfetti(true);
      setIsSold(true);
    } else if (nextAmount < 45000) {
      // Trigger AI counter bid from another team if under max budget
      setTimeout(() => {
        const rivalTeams = DEMO_TEAMS.filter((t) => t.id !== activeTeam.id);
        const randomRival = rivalTeams[Math.floor(Math.random() * rivalTeams.length)];
        const aiAmount = nextAmount + 1000;

        const aiBid: Bid = {
          id: (Date.now() + 1).toString(),
          teamId: randomRival.id,
          team: randomRival.name,
          logoUrl: randomRival.logoUrl,
          amount: aiAmount,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          captain: randomRival.captain,
          color: randomRival.color,
        };

        setBids((prev) => [aiBid, ...prev]);
        setCurrentAmount(aiAmount);
        setTeamBudgets((prev) => ({
          ...prev,
          [randomRival.id]: Math.max(0, (prev[randomRival.id] ?? 50000) - 1000),
        }));
      }, 1800);
    }
  };

  const handleReset = () => {
    setBids(createInitialBids());
    setCurrentAmount(5000);
    setTeamBudgets(INITIAL_TEAM_BUDGETS);
    setIsSold(false);
    setShowConfetti(false);
  };

  return (
    <section className="py-24 relative overflow-hidden bg-slate-950/60 border-y border-white/5">
      <Confetti isActive={showConfetti} duration={5000} onComplete={() => setShowConfetti(false)} />

      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider shadow-lg shadow-cyan-950/50">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>Interactive Live Simulation</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold font-display tracking-tight text-white">
            Experience the Thrill of <br />
            <span className="text-gradient-cyan">Real-Time Bidding</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Choose your franchise below and place live bids in our auction simulator. Watch rival team captains respond in real time.
          </p>

          {/* Real-time Connection Pulse Beam */}
          <div className="max-w-md mx-auto pt-2">
            <div className="flex justify-between text-[11px] text-slate-400 font-semibold mb-1">
              <span>Captain Portal</span>
              <span className="text-cyan-400 font-bold">Real-Time WebSocket Stream</span>
              <span>Live Arena</span>
            </div>
            <AnimatedBeam duration={2.5} gradientStartColor="#06B6D4" gradientStopColor="#F59E0B" />
          </div>
        </div>

        {/* Team Controller Selection Chips */}
        <div className="max-w-4xl mx-auto mb-10">
          <p className="text-xs font-bold text-center uppercase tracking-widest text-slate-400 mb-3">
            SELECT FRANCHISE TO CONTROL:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DEMO_TEAMS.map((team) => {
              const isSelected = team.id === selectedTeamId;
              return (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`p-3 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400/80 shadow-lg shadow-amber-500/10 scale-[1.02]'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900'
                  }`}
                >
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0 bg-slate-950"
                  />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">{team.name}</span>
                    <span className="block text-[10px] text-amber-400 font-medium">
                      Purse: {formatMoney(teamBudgets[team.id] ?? 50000)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Simulator Card Grid wrapped with Border Beam */}
        <BorderBeam lightColor="#F59E0B" lightWidth={300} duration={7}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start p-2">
            {/* Left: Player Card on Lot */}
            <div className="lg:col-span-5 bento-card border border-white/10 bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 space-y-6">
              {/* Live Lot Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    LOT #1 · ACTIVE AUCTION
                  </span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
                  SET A · MARQUEE
                </span>
              </div>

              {/* Player Info Badge */}
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-cyan-600 p-[2px] shadow-xl shadow-amber-500/20 shrink-0">
                  <img
                    src={INITIAL_PLAYER.photoUrl}
                    alt={INITIAL_PLAYER.name}
                    className="w-full h-full object-cover rounded-[14px] bg-slate-950"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-white font-display truncate">{INITIAL_PLAYER.name}</h3>
                  <p className="text-sm font-semibold text-cyan-400 truncate">{INITIAL_PLAYER.role}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      Base: {formatMoney(INITIAL_PLAYER.basePrice)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      APL Season 8
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Highest Bid Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>CURRENT HIGHEST BID</span>
                  <span className="text-cyan-400 flex items-center gap-1 font-semibold">
                    <Zap className="w-3.5 h-3.5 fill-cyan-400" /> LIVE TICKER
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <motion.span
                    key={currentAmount}
                    initial={{ scale: 1.15, color: '#38BDF8' }}
                    animate={{ scale: 1, color: '#FFFFFF' }}
                    transition={{ duration: 0.3 }}
                    className="text-4xl font-extrabold text-white font-display tracking-tight"
                  >
                    {formatMoney(currentAmount)}
                  </motion.span>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    +{formatMoney(1000)} Increment
                  </span>
                </div>
              </div>

              {/* Active Team Purse Meter */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span>{activeTeam.name.toUpperCase()} PURSE</span>
                  <span className="text-amber-400 font-bold">{formatMoney(userBudget)} / ₹50,000</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, (userBudget / 50000) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Interactive Bid Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleUserBid}
                  disabled={isSold || userBudget < 1000}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                >
                  <Gavel className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
                  <span>BID AS {activeTeam.name.toUpperCase()} ({formatMoney(currentAmount + 1000)})</span>
                </button>

                <button
                  onClick={handleReset}
                  className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Demo Simulation</span>
                </button>
              </div>
            </div>

            {/* Right: Live Feed Log */}
            <div className="lg:col-span-7 bento-card border border-white/10 bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 space-y-6 flex flex-col justify-between min-h-[480px]">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h4 className="text-lg font-bold text-white font-display">Live Bid Stream</h4>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{bids.length} Total Bids</span>
                </div>

                {/* Bids Stream List */}
                <div className="mt-6 space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {bids.map((bid, index) => (
                      <motion.div
                        key={bid.id}
                        initial={{ opacity: 0, y: -15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                          index === 0
                            ? 'bg-slate-800/90 border-cyan-500/40 shadow-lg shadow-cyan-950/40'
                            : 'bg-slate-950/50 border-white/5 opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={bid.logoUrl}
                            alt={bid.team}
                            className="w-10 h-10 rounded-xl object-cover border border-white/10 bg-slate-950 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{bid.team}</span>
                              {index === 0 && (
                                <span className="px-2 py-0.5 text-[10px] uppercase font-extrabold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full">
                                  Leading Bid
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">{bid.captain} · {bid.time}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-extrabold text-white font-display">{formatMoney(bid.amount)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Bottom Status Banner */}
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <p className="text-xs text-slate-300">
                    Real-time WebSocket synchronization ensures instant bid updates for all franchise captains.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </BorderBeam>
      </div>
    </section>
  );
}
