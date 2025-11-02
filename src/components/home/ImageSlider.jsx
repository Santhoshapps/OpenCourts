
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/686998ee6a717e0ca083f355/2a9775cab_Gemini_Generated_Image_pg5zgppg5zgppg5z.png',
    title: 'Connect Through Tennis',
    description: 'Join friendly doubles matches and find your perfect playing partners. Our community brings players together for competitive and recreational tennis.'
  },
  {
    url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/686998ee6a717e0ca083f355/07d2e3d85_Gemini_Generated_Image_sz8o7wsz8o7wsz8o.png',
    title: 'Pickleball Fun for Everyone',
    description: 'Discover the fastest-growing sport! Join pickleball games at beautiful community courts and make new friends while staying active.'
  },
  {
    url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fab1b74f4_ChatGPTImageJul30202512_04_33PM.png',
    title: 'Detailed Court Status',
    description: 'Instantly see which courts are in use, which are free, and which will be available soon, all on one screen.'
  },
  {
    url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9583ccda9_image.png',
    title: 'Smart Weather Insights',
    description: 'Plan your game with intelligent weather analysis. Get alerts for heat, wind, and rain so you always play in the best conditions.'
  },
  {
    url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6919abd74_Gemini_Generated_Image_pg5zgppg5zgppg5z.png',
    title: 'Connect with Players',
    description: 'Find local players for tennis or pickleball. Our AI helps match you with others based on skill and playing style.'
  },
  {
    url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/66ae2da93_WhatsAppImage2025-07-30at113542_e6221e28.jpg',
    title: 'Seamless Check-In',
    description: 'Check in with a single tap. Our system confirms you\'re on the court and notifies you when your time is up.'
  },
  {
    url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ae62a38e8_WhatsAppImage2025-07-30at113542_efadd98d.jpg',
    title: 'Accurate Wait Times',
    description: 'No more guessing. Get precise wait time predictions based on real player check-ins and court usage.'
  }
];

const variants = {
  enter: (direction) => {
    return {
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    };
  }
};

export default function ImageSlider() {
  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = useCallback((newDirection) => {
    setPage([(page + newDirection + slides.length) % slides.length, newDirection]);
  }, [page, slides.length]); // Added slides.length to dependency array as it's used inside

  useEffect(() => {
    const timer = setTimeout(() => {
      paginate(1);
    }, 5000);
    return () => clearTimeout(timer);
  }, [page, paginate]);

  return (
    <div className="relative w-full max-w-5xl mx-auto h-[500px] flex items-center justify-center">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          className="w-full h-full absolute flex items-center justify-center"
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
        >
          <div className="relative w-full h-full rounded-2xl shadow-2xl overflow-hidden">
            <img 
              src={slides[page].url} 
              alt={slides[page].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 text-white">
              <h3 className="text-3xl font-bold mb-2">{slides[page].title}</h3>
              <p className="text-lg text-gray-200 max-w-2xl">{slides[page].description}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute top-1/2 -translate-y-1/2 left-0 z-10">
          <button onClick={() => paginate(-1)} className="bg-white/50 hover:bg-white text-gray-800 p-2 rounded-full shadow-md">
            <ChevronLeft className="w-6 h-6" />
          </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-0 z-10">
          <button onClick={() => paginate(1)} className="bg-white/50 hover:bg-white text-gray-800 p-2 rounded-full shadow-md">
            <ChevronRight className="w-6 h-6" />
          </button>
      </div>
       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, i) => (
          <div
            key={i}
            onClick={() => setPage([i, i > page ? 1 : -1])}
            className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${i === page ? 'bg-white' : 'bg-white/50 hover:bg-white'}`}
          />
        ))}
      </div>
    </div>
  );
}
