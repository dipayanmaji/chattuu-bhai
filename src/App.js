import React, { useState } from 'react';
import './App.css';
import { IoMdMoon, IoIosSunny } from "react-icons/io";
import ChatBox from './components/ChatBox';
import Socials from './components/Socials';
import Globe from './components/Globe';
import ParticleBg from './components/ParticleBg';

function App() {
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') ? (localStorage.getItem('darkMode') === "true" ? true : false) : false);

  // responsive window size handler
  window.addEventListener('resize', () => {
    setScreenHeight(window.innerHeight);
    setScreenWidth(window.innerWidth);
  })

  // dark mode handler
  const darkModeHandler = () => {
    localStorage.setItem('darkMode', !darkMode);
    setDarkMode(!darkMode);
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div
        className={`min-w-[280px] min-h-[280px] md:px-10 sm:px-2 px-0 sm:py-2 py-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-black dark:to-black text-zinc-100 dark:text-zinc-200 relative`}
        style={{ height: `${screenHeight}px`, width: `${screenWidth}px` }}
      >

        {/* header */}
        <header className='w-full max-w-4xl h-16 mx-auto flex items-center justify-between p-4 sm:mb-4 dark:bg-neutral-900/50 bg-gray-500/50 text-2xl sm:rounded-lg relative z-10'>
          <h1 className='dark:text-sky-300 text-white'>Chattuu Bhai</h1>
          <span onClick={darkModeHandler} className='cursor-pointer dark:text-sky-300 text-white'>
            {
              darkMode ? <IoIosSunny /> : <IoMdMoon />
            }
          </span>
        </header>

        {/* chat messages and input box */}
        <ChatBox />

        {/* socials */}
        <Socials />

        {/* globe and particle themes for dark mode */}
        <Globe />
        <ParticleBg />

      </div>
    </div>
  );
}

export default App;
