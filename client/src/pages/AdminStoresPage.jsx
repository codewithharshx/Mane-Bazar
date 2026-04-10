import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../utils/api";
import AdminShell from "../components/AdminShell";

const initialStoreForm = {
  name: "",
  slug: "",
  description: "",
  address: "",
  city: "",
  pincode: "",
  lat: "17.2898",
  lng: "74.1492",
  phone: "",
  whatsapp: "",
  openingHours: "Mon-Sun: 7:00 AM - 10:00 PM",
  categories: "grocery, general store",
  images: "",
  deliveryRadiusKm: 8,
  estimatedDeliveryMin: 10,
  estimatedDeliveryMax: 30,
  isOpen: true
};

const AdminStoresPage = () => {
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState(initialStoreForm);
  const [editingId, setEditingId] = useState("");

  const fetchStores = async () => {
    try {
      const { data } = await api.get("/stores?limit=100");
      setStores(data.stores || []);
    } catch (error) {
      toast.error("Unable to load stores");
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const mappedPayload = {
    ...form,
    lat: Number(form.lat),
    lng: Number(form.lng),
    categories: form.categories
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    images: form.images
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    deliveryRadiusKm: Number(form.deliveryRadiusKm),
    estimatedDeliveryMin: Number(form.estimatedDeliveryMin),
    estimatedDeliveryMax: Number(form.estimatedDeliveryMax)
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`/stores/${editingId}`, mappedPayload);
        toast.success("Store updated");
      } else {
        await api.post("/stores", mappedPayload);
        toast.success("Store created");
      }
      setForm(initialStoreForm);
      setEditingId("");
      fetchStores();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save store");
    }
  };

  const handleEdit = (store) => {
    setEditingId(store._id);
    setForm({
      name: store.name,
      slug: store.slug,
      description: store.description || "",
      address: store.address,
      city: store.city,
      pincode: store.pincode,
      lat: store.location?.coordinates?.[1] || "",
      lng: store.location?.coordinates?.[0] || "",
      phone: store.phone || "",
      whatsapp: store.whatsapp || "",
      openingHours: store.openingHours || "",
      categories: (store.categories || []).join(", "),
      images: (store.images || []).join(", "),
      deliveryRadiusKm: store.deliveryRadiusKm || 8,
      estimatedDeliveryMin: store.estimatedDeliveryMin || 10,
      estimatedDeliveryMax: store.estimatedDeliveryMax || 30,
      isOpen: Boolean(store.isOpen)
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/stores/${id}`);
      toast.success("Store deleted");
      fetchStores();
    } catch (error) {
      toast.error("Unable to delete store");
    }
  };

  return (
    <AdminShell
      title="Stores"
      subtitle="Manage local store profiles, delivery settings, and listing metadata."
    >
      <form className="card-surface grid gap-3 p-6 sm:grid-cols-2" onSubmit={handleSubmit}>
        <h2 className="sm:col-span-2 text-2xl font-bold text-slate-900">
          {editingId ? "Edit store" : "Add store"}
        </h2>
        <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="input-field" placeholder="Store name" />
        <input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} className="input-field" placeholder="Store slug" />
        <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="input-field" placeholder="City" />
        <input value={form.pincode} onChange={(event) => setForm((current) => ({ ...current, pincode: event.target.value }))} className="input-field" placeholder="Pincode" />
        <input value={form.lat} onChange={(event) => setForm((current) => ({ ...current, lat: event.target.value }))} className="input-field" placeholder="Latitude" />
        <input value={form.lng} onChange={(event) => setForm((current) => ({ ...current, lng: event.target.value }))} className="input-field" placeholder="Longitude" />
        <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="input-field" placeholder="Phone" />
        <input value={form.whatsapp} onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))} className="input-field" placeholder="WhatsApp" />
        <input value={form.openingHours} onChange={(event) => setForm((current) => ({ ...current, openingHours: event.target.value }))} className="input-field sm:col-span-2" placeholder="Opening hours" />
        <input value={form.categories} onChange={(event) => setForm((current) => ({ ...current, categories: event.target.value }))} className="input-field sm:col-span-2" placeholder="Categories comma separated" />
        <input value={form.images} onChange={(event) => setForm((current) => ({ ...current, images: event.target.value }))} className="input-field sm:col-span-2" placeholder="Image URLs comma separated" />
        <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="input-field sm:col-span-2" placeholder="Address" />
        <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="input-field sm:col-span-2 min-h-24" placeholder="Description" />
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
          <input value={form.deliveryRadiusKm} onChange={(event) => setForm((current) => ({ ...current, deliveryRadiusKm: event.target.value }))} className="input-field" placeholder="Delivery radius km" type="number" />
          <input value={form.estimatedDeliveryMin} onChange={(event) => setForm((current) => ({ ...current, estimatedDeliveryMin: event.target.value }))} className="input-field" placeholder="Min mins" type="number" />
          <input value={form.estimatedDeliveryMax} onChange={(event) => setForm((current) => ({ ...current, estimatedDeliveryMax: event.target.value }))} className="input-field" placeholder="Max mins" type="number" />
        </div>
        <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={form.isOpen} onChange={(event) => setForm((current) => ({ ...current, isOpen: event.target.checked }))} />
          Store is currently open
        </label>
        <div className="sm:col-span-2 flex gap-3">
          <button type="submit" className="gradient-button">
            {editingId ? "Update store" : "Create store"}
          </button>
          {editingId ? (
            <button type="button" className="rounded-full border border-slate-200 px-5 py-3 font-semibold text-slate-700" onClick={() => { setEditingId(""); setForm(initialStoreForm); }}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="card-surface overflow-x-auto p-5">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500">
              <th className="py-3">Store</th>
              <th className="py-3">City</th>
              <th className="py-3">Rating</th>
              <th className="py-3">Status</th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store._id} className="border-t border-slate-100">
                <td className="py-4 font-semibold text-slate-900">{store.name}</td>
                <td className="py-4 text-slate-600">{store.city}</td>
                <td className="py-4 text-slate-600">{store.rating || 0} ★ ({store.totalReviews || 0})</td>
                <td className="py-4">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${store.isOpen ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-600"}`}>
                    {store.isOpen ? "Open" : "Closed"}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex gap-3">
                    <button type="button" onClick={() => handleEdit(store)} className="text-sm font-semibold text-green-700">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(store._id)} className="text-sm font-semibold text-rose-500">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
};

export default AdminStoresPage;
