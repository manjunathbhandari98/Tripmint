import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center px-6">
      <h1 className="text-6xl font-bold text-[#075E54]">404</h1>
      <p className="mt-4 text-lg text-gray-600">
        Oops. This page does not exist.
      </p>

      <Link
        to="/"
        className="mt-6 px-6 py-2.5 bg-[#168c41] text-white rounded-lg 
                   hover:bg-[#07c251] transition"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
