import React from 'react';

const AudioPlayer = ({ filepath }) => {
    if (!filepath) {
      return <div className="text-red-500">No audio file provided.</div>;
    }
    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Audio Preview:</h2>
          <audio controls className="w-full rounded-lg bg-white border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            <source src={filepath} type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>
          <p class="mt-4 text-sm text-gray-600">Make sure your device volume is up to listen to the audio.</p>
        </div>
    );
  };  

export default AudioPlayer;
