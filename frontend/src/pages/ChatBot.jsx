import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import sarahImage from "../assets/sarah.svg";
import gemini from "../assets/gemini.svg";

function App() {
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const { profile, isAuthenticated } = useAuth();
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, generatingAnswer]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [question]);

  async function generateAnswer(e) {
    e.preventDefault();
    if (!question.trim() || generatingAnswer) return;

    setGeneratingAnswer(true);
    const currentQuestion = question;
    setQuestion("");

    setChatHistory((prev) => [...prev, { type: "question", content: currentQuestion }]);

    try {
      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAb61eTCGEVpz6ItgkAaL-DEvPYiD4Q1bA`,
        method: "post",
        data: {
          contents: [{ parts: [{ text: currentQuestion }] }],
        },
      });

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      setChatHistory((prev) => [...prev, { type: "answer", content: aiResponse }]);
      setAnswer(aiResponse);
    } catch (error) {
      console.error(error);
      setChatHistory((prev) => [
        ...prev,
        { type: "answer", content: "Sorry - Something went wrong. Please try again!" },
      ]);
    }
    setGeneratingAnswer(false);
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-r from-white to-orange-200">
      <div className="h-full max-w-4xl mx-auto flex flex-col p-3">
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between py-4 mt-16 bg-white shadow-lg rounded-xl p-5 backdrop-blur-sm bg-white/90"
        >
          <div className="flex items-center gap-3">
            <img src={gemini} alt="Gemini Logo" className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-gray-800">Chat with Aasha</h1>
          </div>
          {isAuthenticated && profile?.photo?.url && (
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={profile.photo.url}
              alt="User Profile"
              className="w-10 h-10 rounded-full border-2 border-orange-400 shadow-md"
            />
          )}
        </motion.header>

        {/* Chat Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto my-4 rounded-xl bg-white/90 shadow-lg p-6 backdrop-blur-sm scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent"
        >
          <AnimatePresence>
            {chatHistory.length === 0 ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center text-center p-6 h-full"
              >
                <img src={sarahImage} alt="Aasha" className="w-32 h-32 mb-6" />
                <h2 className="text-2xl font-bold mb-2">
                  Hi, I'm <span className="text-orange-600">Aasha</span>
                </h2>
                <p className="text-gray-600 mb-4">Your AI Assistant</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  Powered by
                  <span className="font-semibold flex items-center gap-1">
                    Gemini
                    <img src={gemini} alt="Gemini" className="h-4 w-4" />
                  </span>
                </div>
              </motion.div>
            ) : (
              chatHistory.map((chat, index) => (
                <motion.div
                  key={index}
                  initial={{ x: chat.type === "question" ? 20 : -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={`mb-6 ${chat.type === "question" ? "flex flex-row-reverse" : "flex"}`}
                >
                  <div className="flex items-start gap-3 max-w-[80%]">
                    {chat.type === "answer" ? (
                      <img src={sarahImage} alt="Aasha" className="w-8 h-8 rounded-full" />
                    ) : (
                      profile?.photo?.url && (
                        <img src={profile.photo.url} alt="User" className="w-8 h-8 rounded-full" />
                      )
                    )}
                    <div
                      className={`p-4 rounded-2xl shadow-md ${
                        chat.type === "question"
                          ? "bg-orange-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <ReactMarkdown className="prose max-w-none">
                        {chat.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            {generatingAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <img src={sarahImage} alt="Aasha" className="w-8 h-8 rounded-full" />
                <div className="bg-gray-100 p-4 rounded-2xl shadow-md inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Form */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onSubmit={generateAnswer}
          className="bg-white/90 rounded-xl shadow-lg p-4 backdrop-blur-sm border border-gray-200"
        >
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                required
                className="w-full rounded-xl px-4 py-3 pr-12 border-2 border-gray-200 focus:border-orange-400 focus:ring focus:ring-orange-100 resize-none transition-all duration-200 min-h-[52px] max-h-[150px]"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything..."
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    generateAnswer(e);
                  }
                }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className={`p-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center ${
                generatingAnswer ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={generatingAnswer}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

export default App;