import { useState } from "react";
import { createSpace, joinSpace } from "../Service/space";

interface Props {
  onEnterSpace: (spaceId: string, isHost: boolean) => void;
}

const LandingPage = ({ onEnterSpace }: Props) => {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState({ create: false, join: false });

  const handleCreate = async () => {
    try {
      setLoading(prev => ({ ...prev, create: true }));
      const spaceId = Math.random().toString(36).substring(2, 10).toUpperCase();
      await createSpace(spaceId);
      setJoinCode(spaceId);
      onEnterSpace(spaceId, true);
    } catch (err) {
      console.error("Failed to create space:", err);
      alert("Could not create space. Check console.");
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleJoin = async () => {
    try {
      setLoading(prev => ({ ...prev, join: true }));
      const id = joinCode.toUpperCase();
      await joinSpace(id);
      onEnterSpace(id, false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(prev => ({ ...prev, join: false }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 to-black/90">
      <div className="w-full max-w-md bg-slate-800/70 backdrop-blur-lg p-6 sm:p-10 rounded-3xl shadow-xl">
        <h1 className="text-white text-3xl sm:text-4xl font-bold mb-6 text-center">Welcome to Mask</h1>

        <button
          onClick={handleCreate}
          disabled={loading.create}
          className="w-full bg-gradient-to-r from-sky-400 to-sky-600 py-3 rounded-lg text-white font-semibold mb-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
        >
          {loading.create && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
          Host New Space
        </button>

       <div className="flex gap-2 mb-2 w-full">
  <input
    value={joinCode}
    onChange={e => setJoinCode(e.target.value)}
    placeholder="SPACE CODE"
    className="w-full min-w-0 px-2 py-2 rounded-lg bg-slate-700 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
  />

  <button
    onClick={handleJoin}
    disabled={loading.join}
    className="flex-shrink-0 bg-sky-500 px-3 py-2 rounded-lg text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {loading.join && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
    Join
  </button>
</div>

      </div>
    </div>
  );
};

export default LandingPage;
