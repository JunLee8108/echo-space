import { useState } from "react";

const Footer = () => {
  const [hoveredLink, setHoveredLink] = useState(null);
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { name: "About", href: "#" },
    { name: "Terms", href: "#" },
    { name: "Privacy", href: "#" },
    { name: "Contact", href: "#" },
  ];

  return (
    <footer className="mt-auto border-t border-stone-100">
      <div className="max-w-2xl mx-auto p-8">
        <div className="space-y-8">
          {/* Brand Section */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-stone-700 to-stone-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <div>
                <h3 className="text-sm text-left font-semibold text-stone-900">
                  EchoSpace
                </h3>
                <p className="text-xs text-stone-500">
                  Post your mind, hear the world speak back.
                </p>
              </div>
            </div>
          </div>

          {/* Links Section */}
          <nav className="flex items-center justify-center space-x-8">
            {footerLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative text-xs text-stone-600 hover:text-stone-900 transition-colors"
                onMouseEnter={() => setHoveredLink(link.name)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                {link.name}
                <span
                  className={`absolute -bottom-1 left-0 w-full h-0.5 bg-stone-900 transform origin-left transition-transform duration-200 ${
                    hoveredLink === link.name ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </a>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-stone-100">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <p className="text-xs text-stone-500">
                © {currentYear} EchoSpace. All rights reserved.
              </p>
              <div className="flex items-center space-x-4 text-xs text-stone-500">
                <span>Made with</span>
                <svg
                  className="w-4 h-4 text-red-500 animate-pulse"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>by AI Friends</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
