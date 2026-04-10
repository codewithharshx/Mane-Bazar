import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/PageTransition";

const emptyAddress = {
  label: "Home",
  street: "",
  city: "",
  pincode: "",
  phone: "",
  isDefault: false
};

const ProfilePage = () => {
  const { user, updateProfile, addAddress, deleteAddress } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState(emptyAddress);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    await updateProfile({ name, password });
    setPassword("");
  };

  const handleAddressSave = async (event) => {
    event.preventDefault();
    await addAddress(address);
    setAddress(emptyAddress);
  };

  return (
    <PageTransition className="section-shell grid gap-6 py-6 lg:grid-cols-2">
      <div className="card-surface p-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Profile</h1>
        <form className="mt-6 space-y-4" onSubmit={handleProfileSave}>
          <input value={user?.email || ""} disabled className="input-field cursor-not-allowed bg-slate-100" />
          <input value={name} onChange={(event) => setName(event.target.value)} className="input-field" placeholder="Full name" />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="input-field"
            placeholder="New password (optional)"
          />
          <button type="submit" className="gradient-button">
            Save profile
          </button>
        </form>
      </div>

      <div className="card-surface p-6">
        <h2 className="text-2xl font-bold text-slate-900">Saved addresses</h2>
        <div className="mt-5 space-y-3">
          {user?.addresses?.map((item) => (
            <div key={item._id} className="rounded-3xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{item.label}</p>
                <button
                  type="button"
                  onClick={() => deleteAddress(item._id)}
                  className="text-sm font-semibold text-rose-500"
                >
                  Delete
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {item.street}, {item.city} - {item.pincode}
              </p>
            </div>
          ))}
        </div>

        <form className="mt-6 grid gap-3 sm:grid-cols-2" onSubmit={handleAddressSave}>
          <input value={address.label} onChange={(event) => setAddress((current) => ({ ...current, label: event.target.value }))} className="input-field" placeholder="Label" />
          <input value={address.phone} onChange={(event) => setAddress((current) => ({ ...current, phone: event.target.value }))} className="input-field" placeholder="Phone" />
          <input value={address.street} onChange={(event) => setAddress((current) => ({ ...current, street: event.target.value }))} className="input-field sm:col-span-2" placeholder="Street" />
          <input value={address.city} onChange={(event) => setAddress((current) => ({ ...current, city: event.target.value }))} className="input-field" placeholder="City" />
          <input value={address.pincode} onChange={(event) => setAddress((current) => ({ ...current, pincode: event.target.value }))} className="input-field" placeholder="Pincode" />
          <button type="submit" className="gradient-button sm:col-span-2">
            Add address
          </button>
        </form>
      </div>
    </PageTransition>
  );
};

export default ProfilePage;
