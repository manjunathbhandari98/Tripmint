const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-4 px-6 text-center">
      <p className="text-sm text-gray-600">
        © {new Date().getFullYear()} Tripmint · Developed by{" "}
        <span className="font-semibold text-[#075E54]">Manjunath Bhandari</span>
      </p>
    </footer>
  );
};

export default Footer;
