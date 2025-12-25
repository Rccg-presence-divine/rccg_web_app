"use client";
import { useState } from "react";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Here you can hook into your API or email provider
    setStatus("sent");
  }

  return (
    <section id="contact" className="py-16">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-gray-900">Contactez-nous</h2>
        <p className="mt-2 text-gray-700">
          Des questions ? Envie de visiter ou de servir ? Écrivez-nous.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4">
          <input
            required
            type="text"
            name="name"
            placeholder="Votre nom"
            className="px-4 py-3 border rounded shadow-sm"
          />
          <input
            required
            type="email"
            name="email"
            placeholder="Votre email"
            className="px-4 py-3 border rounded shadow-sm"
          />
          <textarea
            required
            name="message"
            placeholder="Votre message"
            rows={5}
            className="px-4 py-3 border rounded shadow-sm"
          ></textarea>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="px-6 py-3 bg-amber-600 text-white rounded"
            >
              Envoyer
            </button>
            {status === "sent" && (
              <span className="text-green-600">
                Merci ! Nous vous répondrons bientôt.
              </span>
            )}
          </div>
        </form>

        <div className="mt-6 text-sm text-gray-600">
          <strong>Adresse:</strong> 123 Rue de la Foi, Ville
          <br />
          <strong>Tél:</strong> +33 1 23 45 67 89
        </div>
      </div>
    </section>
  );
}
