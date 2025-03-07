'use client';

import HeadMovementDetector from './components/HeadMovementDetector';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Head Movement Detection
        </h1>
        <HeadMovementDetector />
        <div className="mt-8 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Allow camera access when prompted</li>
            <li>Position yourself in front of the camera</li>
            <li>The system will track your head movements</li>
            <li>A warning will appear if excessive movement is detected</li>
            <li>Try to keep your head relatively stable</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
