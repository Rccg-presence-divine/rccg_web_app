export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-200 py-8 mt-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-semibold">RCCG PRESENCE DIVINE</h4>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Tous droits réservés
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a href="#" className="text-gray-400 hover:text-white text-sm">
            Mentions légales
          </a>
          <a href="#" className="text-gray-400 hover:text-white text-sm">
            Confidentialité
          </a>
        </div>
      </div>
    </footer>
  );
}
