import { Link } from "react-router-dom";
import PageTransition from "../components/PageTransition";

const NotFoundPage = () => (
  <PageTransition className="section-shell grid min-h-[70vh] place-items-center py-10">
    <div className="max-w-xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-700">404</p>
      <h1 className="mt-3 text-5xl font-extrabold text-slate-900">This aisle does not exist</h1>
      <p className="mt-4 text-lg text-slate-600">
        The page you’re looking for is not available right now. Let’s get you back to the main store.
      </p>
      <Link to="/" className="gradient-button mt-8 inline-flex">
        Return home
      </Link>
    </div>
  </PageTransition>
);

export default NotFoundPage;
