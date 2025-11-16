import { useState, useEffect, type KeyboardEvent } from "react";
import { Send, Heart, MessageCircle, Copy, Check } from "lucide-react";
import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";
import type { Post, Reply } from "../types/int";

interface ChatAreaProps {
  spaceId: string;
  onBack: () => void;
}

interface PostCardProps {
  post: Post;
  onLike: (post: Post) => Promise<void>;
  onAddReply: (postId: string, content: string) => Promise<void>;
}

interface ReplyInputProps {
  postId: string;
  onAddReply: (postId: string, content: string) => Promise<void>;
}

const ChatArea = ({ spaceId, onBack }: ChatAreaProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "spaces", spaceId, "posts"),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      const loaded: Post[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          content: data.content || "",
          timestamp: data.timestamp?.toMillis?.() || Date.now(),
          likes: data.likedBy?.length || 0,
          liked: data.likedBy?.includes("anon") || false,
          replies: data.replies || []
        };
      });
      setPosts(loaded);
    });

    return unsubscribe;
  }, [spaceId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const copySpaceId = () => {
    navigator.clipboard.writeText(spaceId);
    setCopied(true);
    showToast("Space code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    const url = `${window.location.origin}?space=${spaceId}`;
    navigator.clipboard.writeText(url);
    showToast("Share link copied!");
  };

  const handleAddPost = async () => {
    if (!newPost.trim()) return;
    await addDoc(collection(db, "spaces", spaceId, "posts"), {
      content: newPost,
      timestamp: serverTimestamp(),
      likedBy: [],
      replies: []
    });
    setNewPost("");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddPost();
    }
  };

  const handleLike = async (post: Post) => {
    const postRef = doc(db, "spaces", spaceId, "posts", post.id);
    if (post.liked) await updateDoc(postRef, { likedBy: arrayRemove("anon") });
    else await updateDoc(postRef, { likedBy: arrayUnion("anon") });
  };

  const handleAddReply = async (postId: string, content: string) => {
    const postRef = doc(db, "spaces", spaceId, "posts", postId);
    const reply: Reply = {
      id: Math.random().toString(36).substring(2, 8),
      content,
      timestamp: Date.now()
    };
    await updateDoc(postRef, { replies: arrayUnion(reply) });
  };

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-b from-slate-900/50 to-transparent backdrop-blur-xl border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack} 
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            ← Back
          </button>

          <div className="flex items-center gap-2 bg-slate-900/80 rounded-full px-3 py-1.5 border border-slate-800">
            <span className="text-white text-xs font-semibold truncate max-w-[100px]">{spaceId}</span>
            <button onClick={copySpaceId} className="text-slate-400 hover:text-white transition-colors">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
            <button onClick={shareLink} className="text-slate-400 hover:text-white transition-colors" title="Copy shareable link">🔗</button>
          </div>

          <div className="w-12"></div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-30">
        {posts.map(post => (
          <PostCard key={post.id} post={post} onLike={handleLike} onAddReply={handleAddReply} />
        ))}
      </div>

      {/* Input Area */}
{/* Input Area */}
<div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-slate-900/95 to-transparent backdrop-blur-xl border-t border-slate-800/50 z-20">
  <div className="flex items-end gap-2">
    <textarea
      value={newPost}
      onChange={e => setNewPost(e.target.value)}
      onKeyDown={handleKeyPress}
      placeholder="Share something..."
      className="flex-1 rounded-2xl px-4 py-3 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none border border-slate-800 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-slate-900"
      rows={1}
      style={{ maxHeight: '100px' }}
    />
    <button
      onClick={handleAddPost}
      disabled={!newPost.trim()}
      className="bg-gradient-to-r from-sky-500 to-blue-600 p-3 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-sky-500/50 transition-all"
    >
      <Send className="w-5 h-5" />
    </button>
  </div>
</div>


      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
};

// PostCard & ReplyInput remain largely the same, add "Enter to send" in reply input too:

const PostCard = ({ post, onLike, onAddReply }: PostCardProps) => {
  const [showReplies, setShowReplies] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLikeClick = async () => {
    if (isLiking) return;
    setIsLiking(true);
    await onLike(post);
    setTimeout(() => setIsLiking(false), 300);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-3xl p-4 border border-slate-800/50 backdrop-blur-sm">
      <p className="text-white text-[15px] leading-relaxed mb-3">{post.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <button onClick={handleLikeClick} className={`flex items-center gap-1.5 transition-all ${post.liked ? 'text-pink-500' : 'text-slate-400 hover:text-pink-400'} ${isLiking ? 'scale-125' : ''}`}>
          <Heart className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">{post.likes}</span>
        </button>

        <button onClick={() => setShowReplies(!showReplies)} className="flex items-center gap-1.5 text-slate-400 hover:text-sky-400 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{post.replies.length}</span>
        </button>
      </div>

      {showReplies && (
        <div className="mt-4 space-y-2 border-l-2 border-slate-800 pl-4 ml-2">
          {post.replies.map(reply => (
            <div key={reply.id} className="bg-slate-800/50 rounded-2xl px-3 py-2 backdrop-blur-sm border border-slate-700/50">
              <p className="text-slate-200 text-sm">{reply.content}</p>
            </div>
          ))}
          <ReplyInput postId={post.id} onAddReply={onAddReply} />
        </div>
      )}
    </div>
  );
};

const ReplyInput = ({ postId, onAddReply }: ReplyInputProps) => {
  const [reply, setReply] = useState("");

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    await onAddReply(postId, reply);
    setReply("");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2 P-2">
      <input
        value={reply}
        onChange={e => setReply(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Write a reply..."
        className="flex-1 px-1 py-1 rounded-2xl bg-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 border border-slate-700 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-slate-900"
      />
      <button
        onClick={handleSendReply}
        disabled={!reply.trim()}
        className="bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 rounded-full text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-sky-500/30 transition-all"
      >
        Send
      </button>
    </div>
  );
};

export default ChatArea;
