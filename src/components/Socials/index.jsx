import React from "react";
import { FaTwitter, FaLinkedinIn, FaInstagram, FaFacebookF } from "react-icons/fa";
import { FiGithub } from 'react-icons/fi';
import { RxDragHandleDots2 } from "react-icons/rx";

const Socials = () => {
    return (
        <ul
            className="group fixed z-20 top-20 right-0 translate-x-[82%] hover:translate-x-0 transition-all duration-1000 flex bg-sky-900 p-2 rounded-s-full space-x-1"
        >
            <li>
                <a className="group-hover:bg-white/30">
                    <RxDragHandleDots2 />
                </a>
            </li>
            <li>
                <a href="https://github.com/dipayanmaji" target="_blank">
                    <FiGithub />
                </a>
            </li>
            <li>
                <a href="https://twitter.com/dipayanmaji11" target="_blank">
                    <FaTwitter />
                </a>
            </li>
            <li>
                <a href="https://www.linkedin.com/in/dipayanmaji/" target="_blank">
                    <FaLinkedinIn />
                </a>
            </li>
            <li>
                <a href="https://www.instagram.com/dipayan.maji/" target="_blank">
                    <FaInstagram />
                </a>
            </li>
            <li>
                <a href="https://www.facebook.com/dip.ayan.716" target="_blank">
                    <FaFacebookF />
                </a>
            </li>
        </ul>
    )
}

export default Socials;