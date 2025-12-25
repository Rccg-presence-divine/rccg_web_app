export default function About() {
  return (
    <section id="about" className="py-16">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Notre vision</h2>
        <p className="mt-4 text-lg text-gray-700">
          RCCG PRESENCE DIVINE s'engage à manifester la présence de Dieu à
          travers la prière, l'adoration et la formation spirituelle. Nous
          voulons construire une communauté intime, engagée et tournée vers
          l'amour et le service.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-semibold text-amber-600">Adoration</h3>
            <p className="mt-2 text-sm text-gray-600">
              Moments de louange authentique pour adorer Dieu ensemble.
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-semibold text-amber-600">Enseignement</h3>
            <p className="mt-2 text-sm text-gray-600">
              Enseignements bibliques pratiques et applicables à la vie
              quotidienne.
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-semibold text-amber-600">Communauté</h3>
            <p className="mt-2 text-sm text-gray-600">
              Rencontrez des frères et sœurs pour grandir ensemble dans la foi.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
