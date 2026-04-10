import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../utils/api";
import AdminShell from "../components/AdminShell";
import { formatCurrency } from "../utils/formatters";

const initialForm = {
  name: "",
  brand: "",
  category: "",
  storeId: "",
  slug: "",
  price: 0,
  mrp: 0,
  discount: 0,
  stock: 20,
  images: "",
  description: "",
  tags: ""
};

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    icon: "",
    image: ""
  });

  const fetchData = async () => {
    try {
      const [{ data: productData }, { data: categoryData }, { data: storeData }] = await Promise.all([
        api.get("/products?limit=50"),
        api.get("/categories"),
        api.get("/stores?limit=100")
      ]);
      setProducts(productData.products);
      setCategories(categoryData);
      setStores(storeData.stores || []);
    } catch (error) {
      toast.error("Unable to load products");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const mappedPayload = useMemo(
    () => {
      const payload = {
        ...form,
        images: form.images
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        tags: form.tags
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        price: Number(form.price),
        mrp: Number(form.mrp),
        discount: Number(form.discount),
        stock: Number(form.stock)
      };

      if (!payload.storeId) {
        delete payload.storeId;
      }

      return payload;
    },
    [form]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, mappedPayload);
        toast.success("Product updated");
      } else {
        await api.post("/products", mappedPayload);
        toast.success("Product created");
      }
      setForm(initialForm);
      setEditingId("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save product");
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      brand: product.brand,
      category: product.category?._id || product.category,
      storeId: product.storeId?._id || product.storeId || "",
      slug: product.slug,
      price: product.price,
      mrp: product.mrp,
      discount: product.discount,
      stock: product.stock,
      images: product.images?.join(", ") || "",
      description: product.description,
      tags: product.tags?.join(", ") || ""
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      fetchData();
    } catch (error) {
      toast.error("Unable to delete product");
    }
  };

  const handleCategoryCreate = async (event) => {
    event.preventDefault();
    try {
      await api.post("/categories", categoryForm);
      toast.success("Category created");
      setCategoryForm({ name: "", slug: "", icon: "", image: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create category");
    }
  };

  return (
    <AdminShell title="Products" subtitle="Add new products, update stock and pricing, and manage core categories.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form className="card-surface grid gap-3 p-6 sm:grid-cols-2" onSubmit={handleSubmit}>
          <h2 className="sm:col-span-2 text-2xl font-bold text-slate-900">
            {editingId ? "Edit product" : "Add product"}
          </h2>
          <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="input-field" placeholder="Product name" />
          <input value={form.brand} onChange={(e) => setForm((c) => ({ ...c, brand: e.target.value }))} className="input-field" placeholder="Brand" />
          <select value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))} className="input-field">
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          <select value={form.storeId || ""} onChange={(e) => setForm((c) => ({ ...c, storeId: e.target.value }))} className="input-field">
            <option value="">Select store</option>
            {stores.map((store) => (
              <option key={store._id} value={store._id}>
                {store.name}
              </option>
            ))}
          </select>
          <input value={form.slug} onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))} className="input-field" placeholder="Slug" />
          <input value={form.price} onChange={(e) => setForm((c) => ({ ...c, price: e.target.value }))} className="input-field" placeholder="Price" type="number" />
          <input value={form.mrp} onChange={(e) => setForm((c) => ({ ...c, mrp: e.target.value }))} className="input-field" placeholder="MRP" type="number" />
          <input value={form.discount} onChange={(e) => setForm((c) => ({ ...c, discount: e.target.value }))} className="input-field" placeholder="Discount %" type="number" />
          <input value={form.stock} onChange={(e) => setForm((c) => ({ ...c, stock: e.target.value }))} className="input-field" placeholder="Stock" type="number" />
          <input value={form.images} onChange={(e) => setForm((c) => ({ ...c, images: e.target.value }))} className="input-field sm:col-span-2" placeholder="Image URLs comma separated" />
          <input value={form.tags} onChange={(e) => setForm((c) => ({ ...c, tags: e.target.value }))} className="input-field sm:col-span-2" placeholder="Tags comma separated" />
          <textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} className="input-field sm:col-span-2 min-h-28" placeholder="Description" />
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" className="gradient-button">
              {editingId ? "Update product" : "Create product"}
            </button>
            {editingId ? (
              <button type="button" className="rounded-full border border-slate-200 px-5 py-3 font-semibold text-slate-700" onClick={() => { setEditingId(""); setForm(initialForm); }}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <form className="card-surface grid gap-3 p-6" onSubmit={handleCategoryCreate}>
          <h2 className="text-2xl font-bold text-slate-900">Add category</h2>
          <input value={categoryForm.name} onChange={(e) => setCategoryForm((c) => ({ ...c, name: e.target.value }))} className="input-field" placeholder="Category name" />
          <input value={categoryForm.slug} onChange={(e) => setCategoryForm((c) => ({ ...c, slug: e.target.value }))} className="input-field" placeholder="Slug" />
          <input value={categoryForm.icon} onChange={(e) => setCategoryForm((c) => ({ ...c, icon: e.target.value }))} className="input-field" placeholder="Icon label" />
          <input value={categoryForm.image} onChange={(e) => setCategoryForm((c) => ({ ...c, image: e.target.value }))} className="input-field" placeholder="Category image URL" />
          <button type="submit" className="accent-button">
            Create category
          </button>
        </form>
      </div>

      <div className="card-surface overflow-x-auto p-5">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500">
              <th className="py-3">Product</th>
              <th className="py-3">Category</th>
              <th className="py-3">Store</th>
              <th className="py-3">Price</th>
              <th className="py-3">Stock</th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-t border-slate-100">
                <td className="py-4 font-semibold text-slate-900">{product.name}</td>
                <td className="py-4 text-slate-500">{product.category?.name}</td>
                <td className="py-4 text-slate-500">{product.storeId?.name || "-"}</td>
                <td className="py-4">{formatCurrency(product.price)}</td>
                <td className="py-4">{product.stock}</td>
                <td className="py-4">
                  <div className="flex gap-3">
                    <button type="button" onClick={() => handleEdit(product)} className="text-sm font-semibold text-green-700">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(product._id)} className="text-sm font-semibold text-rose-500">
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

export default AdminProductsPage;
