import React, { useState, useEffect, useRef } from 'react';
import { Button } from "./components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
import { Bot, Camera, Download, LogIn, BookOpen, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./components/ui/dialog";
import { jsPDF } from "jspdf";
import Confetti from 'react-confetti';
import { useSpring, animated } from 'react-spring';

// Import the questions data
const questions = {
  'web-development': [
    {
      question: "What does HTML stand for?",
      options: ["Hyper Text Markup Language", "High Tech Multi Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"],
      answer: "Hyper Text Markup Language"
    },
    // ... (other web development questions)
  ],
  'android-development': [
    {
      question: "What programming language is primarily used for Android app development?",
      options: ["Java", "Swift", "C#", "Python"],
      answer: "Java"
    },
    // ... (other android development questions)
  ],
  // ... (other categories)
};

type Question = {
  question: string;
  options: string[];
  answer: string;
}

const App: React.FC = () => {
  const [name, setName] = useState('');
  const [authId, setAuthId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showInstructionsPopup, setShowInstructionsPopup] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const subjects = Object.keys(questions);

  const fadeIn = useSpring({
    opacity: isLoggedIn ? 1 : 0,
    transform: isLoggedIn ? 'translateY(0)' : 'translateY(50px)',
  });

  useEffect(() => {
    if (isLoggedIn && selectedSubject && !quizCompleted) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setQuizCompleted(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLoggedIn, selectedSubject, quizCompleted]);

  useEffect(() => {
    if (cameraEnabled && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Error accessing camera:", err));
    }
  }, [cameraEnabled]);

  const handleLogin = () => {
    if (name.trim() && authId.trim().toUpperCase() === 'INFO.TEST') {
      setIsLoggedIn(true);
      setShowWelcomePopup(true);
    } else {
      alert('Please enter your full name and the correct Authentication ID (INFO.TEST).');
    }
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setShowInstructionsPopup(true);
  };

  const handleStartTest = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeLeft(1800);
    setQuizCompleted(false);
    setShowCorrectAnswers(false);
    setCameraEnabled(true);
    setShowInstructionsPopup(false);
  };

  const handleNextQuestion = () => {
    if (selectedSubject && questions[selectedSubject] && questions[selectedSubject][currentQuestionIndex]) {
      if (selectedAnswer === questions[selectedSubject][currentQuestionIndex].answer) {
        setScore(score + 1);
      }
      setSelectedAnswer('');
      if (currentQuestionIndex < questions[selectedSubject].length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setQuizCompleted(true);
        setCameraEnabled(false);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const calculatePercentile = (score: number) => {
    // This is a placeholder calculation. In a real application, you'd compare against other students' scores.
    return Math.min(100, Math.round((score / (questions[selectedSubject]?.length || 1)) * 100));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add logo
    const logoImg = new Image();
    logoImg.src = 'https://source.unsplash.com/random/100x50?logo';
    doc.addImage(logoImg, 'PNG', 10, 10, 50, 25);

    doc.setFontSize(22);
    doc.text('Tech Test Certificate', 105, 40, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('This certifies that', 105, 60, { align: 'center' });
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(name, 105, 70, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.text('has successfully completed the assessment in', 105, 85, { align: 'center' });
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(selectedSubject.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), 105, 95, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.text('with a score of', 105, 110, { align: 'center' });
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`${(score / (questions[selectedSubject]?.length || 1) * 100).toFixed(2)}%`, 105, 120, { align: 'center' });
    
    doc.save('TechTest_Certificate.pdf');
  };

  const renderLogin = () => (
    <Card className="w-[350px] bg-white bg-opacity-90 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-purple-600">Student Login</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="name" className="text-purple-700">Full Name</Label>
            <Input id="name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} required className="border-purple-300 focus:border-purple-500" />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="authId" className="text-purple-700">Authentication ID</Label>
            <Input 
              id="authId" 
              placeholder="Enter INFO.TEST" 
              value={authId} 
              onChange={(e) => setAuthId(e.target.value)} 
              required
              className="border-purple-300 focus:border-purple-500"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleLogin} className="bg-purple-600 hover:bg-purple-700 text-white">
          <LogIn className="mr-2 h-4 w-4" /> Login
        </Button>
      </CardFooter>
    </Card>
  );

  const renderSubjectSelection = () => (
    <Card className="w-full max-w-4xl bg-white bg-opacity-90 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-purple-600">Select a Subject</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <Button key={subject} onClick={() => handleSubjectSelect(subject)} className="h-24 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-300 transform hover:scale-105">
            <BookOpen className="mr-2 h-6 w-6" />
            {subject.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </Button>
        ))}
      </CardContent>
    </Card>
  );

  const renderQuiz = () => {
    const currentQuestion = questions[selectedSubject]?.[currentQuestionIndex];
    if (!currentQuestion) return null;

    return (
      <Card className="w-full max-w-2xl bg-white bg-opacity-90 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-purple-600">{selectedSubject.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Quiz</CardTitle>
          <div className="text-right text-purple-700 font-semibold">Time Left: {formatTime(timeLeft)}</div>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4 text-purple-700">Question {currentQuestionIndex + 1} of {questions[selectedSubject]?.length}</h3>
          <p className="mb-4 text-gray-800">{currentQuestion.question}</p>
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value={option} id={`option-${index}`} className="text-purple-600" />
                <Label htmlFor={`option-${index}`} className="text-gray-700">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button onClick={handleNextQuestion} disabled={!selectedAnswer} className="bg-purple-600 hover:bg-purple-700 text-white">
            {currentQuestionIndex < (questions[selectedSubject]?.length || 0) - 1 ? 'Next Question' : 'Finish Quiz'}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderResults = () => (
    <Card className="w-full max-w-2xl bg-white bg-opacity-90 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-purple-600">Quiz Results</CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4 text-purple-700">
          You scored {score} out of {questions[selectedSubject]?.length} ({(score / (questions[selectedSubject]?.length || 1) * 100).toFixed(2)}%)
        </h3>
        <p className="text-gray-700">Your percentile ranking: {calculatePercentile(score)}%</p>
        <Button onClick={() => setShowCorrectAnswers(!showCorrectAnswers)} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white">
          {showCorrectAnswers ? 'Hide Correct Answers' : 'Show Correct Answers'}
        </Button>
        {showCorrectAnswers && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2 text-purple-700">Correct Answers:</h4>
            {questions[selectedSubject]?.map((q: Question, index: number) => (
              <p key={index} className="text-gray-700">
                Q{index + 1}: {q.answer}
              </p>
            ))}
          </div>
        )}
        <Button onClick={() => setSelectedSubject('')} className="mt-4 ml-4 bg-pink-500 hover:bg-pink-600 text-white">
          <BookOpen className="mr-2 h-4 w-4" /> Take Another Quiz
        </Button>
        <Button onClick={generatePDF} className="mt-4 ml-4 bg-green-500 hover:bg-green-600 text-white">
          <Download className="mr-2 h-4 w-4" /> Download Certificate (PDF)
        </Button>
      </CardContent>
    </Card>
  );

  const renderChatbot = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <Button onClick={() => setShowChatbot(!showChatbot)} className="rounded-full w-12 h-12 p-0 bg-purple-600 hover:bg-purple-700 text-white">
        <Bot className="w-6 h-6" />
      </Button>
      {showChatbot && (
        <Card className="absolute bottom-16 right-0 w-80 bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-purple-600">AI Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">How can I help you with the quiz?</p>
          </CardContent>
          <CardFooter>
            <Input placeholder="Type your question..." className="mr-2 border-purple-300 focus:border-purple-500" />
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">Send</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-4"
      style={{
        backgroundImage: `url('https://source.unsplash.com/random/1920x1080?abstract')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {showConfetti && <Confetti />}
      {cameraEnabled && (
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 mt-4 z-50">
          <video ref={videoRef} autoPlay muted className="w-64 h-48 rounded-lg shadow-lg" />
        </div>
      )}
      {!isLoggedIn && renderLogin()}
      {isLoggedIn && (
        <animated.div style={fadeIn} className="w-full flex flex-col items-center">
          {!selectedSubject && renderSubjectSelection()}
          {selectedSubject && !quizCompleted && renderQuiz()}
          {quizCompleted && renderResults()}
        </animated.div>
      )}
      {renderChatbot()}

      <Dialog open={showWelcomePopup} onOpenChange={setShowWelcomePopup}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-600">Welcome to CyberWave Assessment Portal</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-gray-700">
            Hello {name}! We're excited to have you here. Get ready to showcase your skills and knowledge.
          </DialogDescription>
          <DialogFooter>
            <Button onClick={() => setShowWelcomePopup(false)} className="bg-purple-600 hover:bg-purple-700 text-white">
              <CheckCircle className="mr-2 h-4 w-4" /> Let's Begin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInstructionsPopup} onOpenChange={setShowInstructionsPopup}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-600">Test Instructions</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>You will have 30 minutes to complete the test.</li>
              <li>There are 25 multiple-choice questions.</li>
              <li>Each question has only one correct answer.</li>
              <li>You cannot go back to previous questions.</li>
              <li>Ensure your camera is enabled for proctoring.</li>
              <li>Do not leave the test window or use other applications.</li>
              <li>Your results will be available immediately after completion.</li>
              <li>You can download your certificate after finishing the test.</li>
              <li>If you face any technical issues, use the AI chatbot for assistance.</li>
              <li>Good luck and do your best!</li>
            </ol>
          </DialogDescription>
          <DialogFooter>
            <Button onClick={handleStartTest} className="bg-purple-600 hover:bg-purple-700 text-white">
              <CheckCircle className="mr-2 h-4 w-4" /> Start Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default App;