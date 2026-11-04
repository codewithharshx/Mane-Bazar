import CartDrawer from "../components/CartDrawer";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const AppShell = ({ children }) => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <CartDrawer />
      {children}
      <Footer />
    </div>
  );
};

export default AppShell;
