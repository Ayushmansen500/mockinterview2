import { useParams } from 'react-router-dom';

export function PublicActivenessBoard() {
  const { publicId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Activeness Board
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-600">
            Public activeness board view for ID: {publicId}
          </p>
        </div>
      </div>
    </div>
  );
}
