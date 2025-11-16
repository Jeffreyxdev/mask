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
      setJoinCode(spaceId); // auto-fill joinCode for sharing
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
    <div className="h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-black/90">
      <div className="p-10 rounded-3xl w-full max-w-md bg-slate-800/70 backdrop-blur-lg">
        <h1 className="text-white text-2xl font-bold mb-6 text-center">Welcome to Mask</h1>

        {/* Host Button */}
        <button
          onClick={handleCreate}
          disabled={loading.create}
          className="w-full bg-linear-to-r from-sky-400 to-sky-600 py-3 rounded-lg text-white font-semibold mb-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading.create && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
          Host New Space
        </button>

        {/* Join Section */}
        <div className="flex gap-2 mb-2">
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            placeholder="SPACE CODE"
            className="flex-1 px-4 py-2 rounded-xl bg-slate-700 text-white focus:outline-none"
          />
          <button
            onClick={handleJoin}
            disabled={loading.join}
            className="bg-sky-500 px-4 rounded-lg text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.join && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            Join
          </button>
        </div>

     
      </div>
    </div>
  );
};

export default LandingPage;
