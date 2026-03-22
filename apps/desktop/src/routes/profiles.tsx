import { useState, useEffect } from 'react';
import { useConfig } from '@/lib/ConfigContext';
import { User, GraduationCap, Wallet, Activity, Save, CheckCircle, BrainCircuit } from 'lucide-react';

const Profiles = () => {
    const { config, saveConfig } = useConfig();
    const [localProfiles, setLocalProfiles] = useState({
        profilePersonal: '',
        profileAcademic: '',
        profileFinancial: '',
        profileFitness: '',
        profileMasterPlan: '',
        strategistPrompt: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showSavedMsg, setShowSavedMsg] = useState(false);

    useEffect(() => {
        if (config) {
            setLocalProfiles({
                profilePersonal: config.profilePersonal || '',
                profileAcademic: config.profileAcademic || '',
                profileFinancial: config.profileFinancial || '',
                profileFitness: config.profileFitness || '',
                profileMasterPlan: config.profileMasterPlan || '',
                strategistPrompt: config.strategistPrompt || '',
            });
        }
    }, [config]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveConfig(localProfiles);
            setShowSavedMsg(true);
            setTimeout(() => setShowSavedMsg(false), 3000);
        } catch (err) {
            console.error('Failed to save profiles:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const profileCards = [
        {
            id: 'profilePersonal',
            title: 'Personal Profile',
            description: 'Who you are, your values, personality, and life philosophy.',
            icon: User,
            color: 'from-blue-500/20 to-indigo-500/20',
            iconColor: 'text-blue-400',
        },
        {
            id: 'profileAcademic',
            title: 'Academic Profile',
            description: 'Skills, education, learning goals, and intellectual pursuits.',
            icon: GraduationCap,
            color: 'from-purple-500/20 to-pink-500/20',
            iconColor: 'text-purple-400',
        },
        {
            id: 'profileFinancial',
            title: 'Financial Profile',
            description: 'Wealth goals, budget philosophy, and career trajectory.',
            icon: Wallet,
            color: 'from-emerald-500/20 to-teal-500/20',
            iconColor: 'text-emerald-400',
        },
        {
            id: 'profileFitness',
            title: 'Fitness Profile',
            description: 'Health habits, athletic goals, and physical well-being.',
            icon: Activity,
            color: 'from-orange-500/20 to-red-500/20',
            iconColor: 'text-orange-400',
        },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-full bg-[#030303] text-zinc-100">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Life Profiles</h1>
                    <p className="text-zinc-500 text-lg">Your core identity and long-term memory for the Life OS Strategist.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${isSaving
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-zinc-200 hover:scale-105 active:scale-95'
                        }`}
                >
                    {isSaving ? (
                        <div className="w-5 height-5 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
                    ) : showSavedMsg ? (
                        <CheckCircle size={20} className="text-emerald-600" />
                    ) : (
                        <Save size={20} />
                    )}
                    {showSavedMsg ? 'Saved' : 'Save Profiles'}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profileCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.id}
                            className={`group flex flex-col rounded-2xl border border-zinc-800/50 bg-gradient-to-br ${card.color} p-1 transition-all duration-300 hover:border-zinc-700/50 hover:shadow-2xl hover:shadow-black`}
                        >
                            <div className="bg-[#09090b] rounded-[14px] p-6 flex flex-col h-full">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-3 rounded-xl bg-zinc-900/50 ${card.iconColor} ring-1 ring-zinc-800`}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{card.title}</h2>
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest">{card.description}</p>
                                    </div>
                                </div>

                                <textarea
                                    value={localProfiles[card.id as keyof typeof localProfiles]}
                                    onChange={(e) => setLocalProfiles(prev => ({ ...prev, [card.id]: e.target.value }))}
                                    placeholder={`Paste your ${card.title.toLowerCase()} details here...`}
                                    className="w-full flex-grow min-h-[300px] bg-[#0c0c0e] border border-zinc-800/50 rounded-xl p-4 text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-700/50 transition-all resize-none font-mono text-sm leading-relaxed"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6">
                <div
                    className="group flex flex-col rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-amber-500/20 to-orange-600/20 p-1 transition-all duration-300 hover:border-zinc-700/50 hover:shadow-2xl hover:shadow-black"
                >
                    <div className="bg-[#09090b] rounded-[14px] p-6 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-zinc-900/50 text-amber-400 ring-1 ring-zinc-800">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-amber-400">Master Strategic Plan</h2>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest">The "Ground Truth" for your life. Vision, Kadence, and Core Process.</p>
                            </div>
                        </div>

                        <textarea
                            value={localProfiles.profileMasterPlan}
                            onChange={(e) => setLocalProfiles(prev => ({ ...prev, profileMasterPlan: e.target.value }))}
                            placeholder="Paste your Master Plan here (based on the strategist prompt structure)..."
                            className="w-full min-h-[500px] bg-[#0c0c0e] border border-zinc-800/50 rounded-xl p-6 text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all resize-y font-mono text-sm leading-relaxed"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <div
                    className="group flex flex-col rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-purple-500/20 to-blue-600/20 p-1 transition-all duration-300 hover:border-zinc-700/50 hover:shadow-2xl hover:shadow-black"
                >
                    <div className="bg-[#09090b] rounded-[14px] p-6 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-zinc-900/50 text-purple-400 ring-1 ring-zinc-800">
                                <BrainCircuit size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-purple-400">Strategist Master Prompt</h2>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest">The "System Brain" that dictates AI logic and persona.</p>
                            </div>
                        </div>

                        <textarea
                            value={localProfiles.strategistPrompt}
                            onChange={(e) => setLocalProfiles(prev => ({ ...prev, strategistPrompt: e.target.value }))}
                            placeholder="Paste the Strategist System Prompt here..."
                            className="w-full min-h-[400px] bg-[#0c0c0e] border border-zinc-800/50 rounded-xl p-6 text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all resize-y font-mono text-sm leading-relaxed"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Activity size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-blue-400 mb-1">Strategist Integration</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                        These profiles are automatically fed to the Strategist AI as context. Keep them updated to ensure
                        your personal advisor has the most accurate understanding of your life, goals, and constraints.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Profiles;
