import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyBvBbUgAWfII3EXoOAKpyIZTlzj748whPo",
  authDomain: "counselapp-5c4a9.firebaseapp.com",
  projectId: "counselapp-5c4a9",
  storageBucket: "counselapp-5c4a9.appspot.com",
  messagingSenderId: "297366883729",
  appId: "1:297366883729:web:fc2d51813fdbbe6d2dde30",
  measurementId: "G-MQSTZQLP80"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);


const AnxietyManagementApp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.removeEventListener('dataavailable', handleDataAvailable);
        mediaRecorderRef.current.removeEventListener('stop', handleStop);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.addEventListener('dataavailable', handleDataAvailable);
      mediaRecorderRef.current.addEventListener('stop', handleStop);
      mediaRecorderRef.current.start();
      setIsRecording(true);
      audioChunksRef.current = [];
    } catch (err) {
      setError('Error accessing microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDataAvailable = (event) => {
    if (event.data.size > 0) {
      audioChunksRef.current.push(event.data);
    }
  };

  const handleStop = () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    setAudioBlob(audioBlob);
    audioRef.current.src = URL.createObjectURL(audioBlob);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const uploadAudio = async (blob) => {
    const fileName = `audio_${Date.now()}.wav`;
    const storageRef = ref(storage, fileName);
    
    try {
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading file: ", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioBlob) {
      setError('Please record audio before submitting.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Upload the audio and get the URL
      const audioUrl = await uploadAudio(audioBlob);

      // Send the URL to your API
      const res = await fetch('http://127.0.0.1:5005/ask_audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_url: audioUrl }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError('An error occurred while processing the audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900 text-center">Anxiety Management Assistant</h1>
          <p className="mt-1 text-sm text-gray-500 text-center">Record your question to get advice</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-center space-x-4 mb-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full flex items-center"
              >
                <Mic className="mr-2" /> Record
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full flex items-center"
              >
                <Square className="mr-2" /> Stop
              </button>
            )}
            {audioBlob && (
              <button
                onClick={togglePlayPause}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full flex items-center"
              >
                {isPlaying ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              disabled={isLoading || !audioBlob}
              className={`mt-4 w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md ${
                isLoading || !audioBlob ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
              }`}
            >
              {isLoading ? 'Processing...' : 'Get Advice'}
            </button>
          </form>
        </div>
        <div className="px-4 py-4 sm:px-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {response && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-2">Response:</h2>
              <p className="mb-2"><strong>Your question:</strong> {response.transcribed_question}</p>
              <p className="mb-2"><strong>Similar question:</strong> {response.most_relevant_question}</p>
              <p><strong>Answer:</strong> {response.answer}</p>
              <p><strong>Emotion:</strong> {response.emotion}</p>
              <p><strong>counsel_chat:</strong> {response.counsel_chat}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnxietyManagementApp;