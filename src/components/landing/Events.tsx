const mockEvents = [
  {
    id: 1,
    title: "Culte de louange",
    date: "Dimanche 11 janvier",
    desc: "Un culte puissant de louange et adoration.",
  },
  {
    id: 2,
    title: "Soirée de prière",
    date: "Mercredi 14 janvier",
    desc: "Temps de prière et intercession.",
  },
  {
    id: 3,
    title: "Rencontre des jeunes",
    date: "Samedi 17 janvier",
    desc: "Ateliers et partage pour les jeunes adultes.",
  },
];

export default function Events() {
  return (
    <section id="events" className="py-16 bg-amber-50">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-gray-900">Événements à venir</h2>
        <p className="mt-2 text-gray-700">
          Rejoignez-nous lors de nos prochains rassemblements.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {mockEvents.map((e) => (
            <article key={e.id} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold text-gray-900">{e.title}</h3>
              <p className="mt-1 text-sm text-amber-600">{e.date}</p>
              <p className="mt-2 text-sm text-gray-600">{e.desc}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 text-center">
          <a
            href="#"
            className="inline-flex items-center px-5 py-2 bg-white border border-amber-600 text-amber-600 rounded"
          >
            Voir tous les événements
          </a>
        </div>
      </div>
    </section>
  );
}
