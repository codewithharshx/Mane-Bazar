import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, MapPin, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { user, updateProfile, deleteAddress, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name });
    } catch { toast.error("Failed to update profile"); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-8">My Profile</h1>
      {/* Profile Info */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full rounded-2xl object-cover" />
              : <User size={28} className="text-green-600" />}
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">{user?.name}</h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <span className={`inline-block text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${user?.isVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {user?.isVerified ? "Verified" : "Not Verified"}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-60">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
      {/* Addresses */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><MapPin size={16} /> Saved Addresses</h3>
        {(user?.addresses || []).length === 0
          ? <p className="text-slate-400 text-sm">No addresses saved yet.</p>
          : (user?.addresses || []).map((addr: any, i: number) => (
            <div key={addr.id || addr._id || i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-700">{addr.label || "Home"}</p>
                <p className="text-xs text-slate-500">{addr.street}, {addr.city} - {addr.pincode}</p>
              </div>
              <button onClick={() => deleteAddress(addr.id || addr._id)}
                className="text-slate-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
            </div>
          ))}
      </div>
      {/* Logout */}
      <button onClick={logout}
        className="w-full border border-red-200 text-red-500 hover:bg-red-50 font-semibold py-3 rounded-xl transition-colors">
        Sign Out
      </button>
    </div>
  );
};
export default ProfilePage;
