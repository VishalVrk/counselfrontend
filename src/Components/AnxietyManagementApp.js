import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AudioPlayer from './AudioPlayer';

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
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transcribedText, setTranscribedText] = useState("");

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

  const startListening = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      console.log("Recognized text:", spokenText);
      setTranscribedText(spokenText);
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
      setError("Error in voice recognition. Please try again.");
    };
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.addEventListener('dataavailable', handleDataAvailable);
      mediaRecorderRef.current.addEventListener('stop', handleStop);
      mediaRecorderRef.current.start();
      setIsRecording(true);
      audioChunksRef.current = [];
      startListening();  // Start voice recognition as recording begins
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
      const audioUrl = await uploadAudio(audioBlob);
      const url = 'http://192.168.1.47:5005';
      const res = await fetch(`${url}/ask_audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_url: audioUrl, transcribed_text: transcribedText}),
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Anxiety Management Assistant</h1>
            <p className="text-indigo-100">Share your thoughts and receive personalized guidance</p>
          </div>

          {/* Recording Controls */}
          <div className="px-6 py-8">
            <div className="flex justify-center space-x-6 mb-8">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-full flex items-center transform transition-transform duration-200 hover:scale-105 shadow-md"
                >
                  <Mic className="mr-2 h-5 w-5" /> Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-full flex items-center transform transition-transform duration-200 hover:scale-105 shadow-md"
                >
                  <Square className="mr-2 h-5 w-5" /> Stop Recording
                </button>
              )}
            </div>

            {/* Transcribed Text Display */}
            {transcribedText && (
              <div className="mt-4 text-gray-900 bg-gray-100 p-4 rounded-md">
                <p>Transcribed Text: {transcribedText}</p>
              </div>
            )}

            {/* Submit Button */}
            <form onSubmit={handleSubmit} className="mt-6">
              <button
                type="submit"
                disabled={isLoading || !audioBlob}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white shadow-md transition-all duration-200
                  ${isLoading || !audioBlob 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105'
                  }`}
              >
                {isLoading ? 'Processing...' : 'Get Advice'}
              </button>
            </form>

            {/* Error Display */}
            {error && (
              <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Response Section */}
            {response && (
  <div className="mt-8 space-y-6 bg-gray-50 p-6 rounded-xl">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Analysis</h2>
    
    <div className="space-y-4">
      {/* Display Transcribed Question */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Your Question</h3>
        <p className="mt-1 text-gray-900">{response.transcribed_question}</p>
      </div>

      {/* Display Most Relevant Question */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Similar Question</h3>
        <p className="mt-1 text-gray-900">{response.most_relevant_question}</p>
      </div>

      {/* Display Answer */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Answer</h3>
        <p className="mt-1 text-gray-900">{response.answer}</p>
      </div>

      {/* Display Emotional Context */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Emotional Context</h3>
        <p className="mt-1 text-gray-900">{response.emotion}</p>
      </div>

      {/* Display Counseling Perspective */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Counseling Perspective</h3>
        <p className="mt-1 text-gray-900">{response.counsel_chat}</p>
      </div>

      {/* Display Audio Response */}
      {response.filepath && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Audio Response</h3>
          <div className="mt-2">
            <AudioPlayer filepath={`http://192.168.1.47:5005${response.filepath}`} />
          </div>
        </div>
      )}
    </div>
  </div>
)}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AnxietyManagementApp;
