'use client';

import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

const HeadMovementDetector = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [model, setModel] = useState(null);
    const [warning, setWarning] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [hasPermission, setHasPermission] = useState(true);
    const [debugInfo, setDebugInfo] = useState('Initializing...');
    const previousPositionRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Initialize TensorFlow.js and load the BlazeFace model
    useEffect(() => {
        const initializeDetector = async () => {
            try {
                setDebugInfo('Setting up TensorFlow.js...');
                
                // Initialize TensorFlow.js
                await tf.ready();
                console.log('TensorFlow.js initialized');
                setDebugInfo('Loading face detection model...');
                
                // Load BlazeFace model
                const model = await blazeface.load();
                console.log('BlazeFace model loaded');
                
                setDebugInfo('Model loaded successfully!');
                setModel(model);
                setIsInitialized(true);
            } catch (error) {
                console.error('Error initializing face detector:', error);
                setDebugInfo(`Error: ${error.message}`);
                setWarning('Error initializing face detection model. Please make sure you are using a modern browser.');
            }
        };

        initializeDetector();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Initialize webcam
    useEffect(() => {
        const setupCamera = async () => {
            try {
                setDebugInfo('Setting up camera...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        width: 640,
                        height: 480,
                        facingMode: 'user',
                        frameRate: { ideal: 30 }
                    },
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        console.log('Camera stream loaded');
                        setDebugInfo('Camera setup complete');
                    };
                }
            } catch (error) {
                console.error('Error accessing webcam:', error);
                setDebugInfo(`Camera Error: ${error.message}`);
                setHasPermission(false);
                setWarning('Please allow camera access to use this feature');
            }
        };

        if (isInitialized) {
            setupCamera();
        }

        return () => {
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [isInitialized]);

    // Detect face and track movement
    const detectFace = async () => {
        if (!model || !videoRef.current || !canvasRef.current) {
            console.log('Missing required elements:', { 
                hasModel: !!model, 
                hasVideo: !!videoRef.current, 
                hasCanvas: !!canvasRef.current 
            });
            return;
        }

        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        try {
            const predictions = await model.estimateFaces(videoRef.current, false);
            console.log('Face detection result:', predictions.length > 0 ? 'Face detected' : 'No face detected');
            
            if (predictions.length > 0) {
                const face = predictions[0];
                const nose = {
                    x: (face.landmarks[2][0] + face.landmarks[3][0]) / 2,
                    y: (face.landmarks[2][1] + face.landmarks[3][1]) / 2
                };

                // Draw face box
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    face.topLeft[0], face.topLeft[1],
                    face.bottomRight[0] - face.topLeft[0],
                    face.bottomRight[1] - face.topLeft[1]
                );

                // Draw landmarks
                ctx.fillStyle = '#00ff00';
                face.landmarks.forEach(point => {
                    ctx.beginPath();
                    ctx.arc(point[0], point[1], 3, 0, 2 * Math.PI);
                    ctx.fill();
                });

                if (previousPositionRef.current) {
                    const movementX = nose.x - previousPositionRef.current.x;
                    const movementY = nose.y - previousPositionRef.current.y;
                    const threshold = 5;

                    // Draw movement vector
                    ctx.beginPath();
                    ctx.moveTo(previousPositionRef.current.x, previousPositionRef.current.y);
                    ctx.lineTo(nose.x, nose.y);
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    if (Math.abs(movementX) > threshold || Math.abs(movementY) > threshold) {
                        const direction = [];
                        if (Math.abs(movementX) > threshold) {
                            direction.push(movementX > 0 ? 'right' : 'left');
                        }
                        if (Math.abs(movementY) > threshold) {
                            direction.push(movementY > 0 ? 'down' : 'up');
                        }
                        console.log('Movement detected:', direction.join(' and '));
                        setWarning(`Head movement detected: ${direction.join(' and ')}!`);
                    } else {
                        setWarning('');
                    }
                }

                previousPositionRef.current = nose;
                setDebugInfo('Tracking face movements...');
            } else {
                setDebugInfo('No face detected in frame');
                setWarning('No face detected');
                previousPositionRef.current = null;
            }
        } catch (error) {
            console.error('Error in face detection:', error);
            setDebugInfo(`Detection error: ${error.message}`);
        }

        animationFrameRef.current = requestAnimationFrame(detectFace);
    };

    // Start detection when video is ready
    const handleVideoPlay = () => {
        console.log('Video started playing');
        setDebugInfo('Video started - beginning detection');
        detectFace();
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto p-4">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    onPlay={handleVideoPlay}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                    width={640}
                    height={480}
                />
                
                {warning && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg">
                        {warning}
                    </div>
                )}

                {!hasPermission && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white text-center p-4">
                        <p>Camera access is required for head movement detection.</p>
                    </div>
                )}

                {!isInitialized && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                            <p>Initializing face detection...</p>
                            <p className="text-sm text-gray-300 mt-2">{debugInfo}</p>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                    {debugInfo}
                </div>
            </div>
        </div>
    );
};

export default HeadMovementDetector; 