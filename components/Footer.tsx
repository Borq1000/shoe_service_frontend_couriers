import React from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";

const Footer = () => {
  return (
    <section className="bg-white">
      <div className="max-w-screen-xl px-4 py-12 mx-auto space-y-8 overflow-hidden sm:px-6 lg:px-8">
        <nav className="flex flex-wrap justify-center -mx-5 -my-2">
          <div className="px-5 py-2">
            <Link href="#">
              <span className="text-base leading-6 text-gray-500 hover:text-gray-900">
                О нас
              </span>
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="#">
              <span className="text-base leading-6 text-gray-500 hover:text-gray-900">
                Блог
              </span>
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="#">
              <span className="text-base leading-6 text-gray-500 hover:text-gray-900">
                Цены
              </span>
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="#">
              <span className="text-base leading-6 text-gray-500 hover:text-gray-900">
                Контакты
              </span>
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="#">
              <span className="text-base leading-6 text-gray-500 hover:text-gray-900">
                Условия
              </span>
            </Link>
          </div>
        </nav>
        <div className="flex justify-center mt-8 space-x-6">
          <a
            href="#"
            className="text-gray-400 hover:text-gray-500"
            aria-label="Facebook"
          >
            <FaFacebookF className="w-6 h-6" />
          </a>
          <a
            href="#"
            className="text-gray-400 hover:text-gray-500"
            aria-label="Instagram"
          >
            <FaInstagram className="w-6 h-6" />
          </a>
          <a
            href="#"
            className="text-gray-400 hover:text-gray-500"
            aria-label="Twitter"
          >
            <FaTwitter className="w-6 h-6" />
          </a>
        </div>
        <p className="mt-8 text-base leading-6 text-center text-gray-400">
          © 2024 ShoeMaster. Все права защищены.
        </p>
      </div>
    </section>
  );
};

export default Footer;
