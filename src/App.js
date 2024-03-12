import React, { useState } from 'react';
import './App.css';
import ChatBox from './components/ChatBox';
import ParticleBg from './components/ParticleBg';
import { IoMdMoon, IoIosSunny } from "react-icons/io";
import Globe from './components/Globe';

function App() {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') ? (localStorage.getItem('darkMode') === "true" ? true : false) : true);

  const darkModeHandler = () => {
    localStorage.setItem('darkMode', !darkMode);
    setDarkMode(!darkMode);
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className='w-full h-screen md:px-10 px-4 py-[2%] bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-black dark:to-black text-zinc-100 dark:text-zinc-200 relative'>

        <header className='w-full max-w-4xl h-[10%] mx-auto flex items-center justify-between p-4 mb-4 dark:bg-neutral-900/50 bg-gray-500/50 text-2xl rounded-lg relative z-10'>
          <h1 className='dark:text-sky-300 text-white'>Chattuu Bhai</h1>
          <span onClick={darkModeHandler} className='cursor-pointer dark:text-sky-300 text-white'>{
            darkMode ? <IoIosSunny /> : <IoMdMoon />
          }</span>
        </header>

        <ChatBox />

        <Globe />
        <ParticleBg />

      </div>
    </div>
  );
}

export default App;
