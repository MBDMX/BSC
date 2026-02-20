import React from "react";
import Navbar from "../components/Navbar";

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">⚠️ Erreur</h1>
          <p className="text-lg text-gray-700">
            {statusCode
              ? `Une erreur ${statusCode} est survenue sur le serveur.`
              : "Une erreur est survenue côté client."}
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
