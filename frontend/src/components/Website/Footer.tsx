import { Link } from 'react-router-dom';
import darkLogo from '../../assets/Logos/Logo for Dark Backgrounds 2.svg';

const Footer = () => {
  return (
    <footer className="bg-surface border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="md:col-span-1">
            <Link to="/" className="mb-4 block">
              <img src={darkLogo} alt="Ride Club" className="h-14 w-auto object-contain" />
            </Link>
            <p className="text-white text-sm leading-relaxed mb-6">
              Two Wheels, One Soul. Discover routes. Meet riders. Create unforgettable journeys with the world's most premium motorcycle community.
            </p>
            <div className="flex space-x-4">  
              <a href="#" className="text-white hover:text-white transition-colors text-sm font-medium">IG</a>
              <a href="#" className="text-white hover:text-white transition-colors text-sm font-medium">FB</a>
              <a href="#" className="text-white hover:text-white transition-colors text-sm font-medium">YT</a>
              <a href="#" className="text-white hover:text-white transition-colors text-sm font-medium">IN</a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link to="/features" className="text-white hover:text-white text-sm transition-colors">Features</Link></li>
              <li><Link to="/safety" className="text-white hover:text-white text-sm transition-colors">Safety</Link></li>
              <li><Link to="/community" className="text-white hover:text-white text-sm transition-colors">Community</Link></li>
              <li><Link to="/download" className="text-white hover:text-white text-sm transition-colors">Download App</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-white hover:text-white text-sm transition-colors">About Us</Link></li>
              <li><Link to="/blog" className="text-white hover:text-white text-sm transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="text-white hover:text-white text-sm transition-colors">Contact</Link></li>
              <li><Link to="/support" className="text-white hover:text-white text-sm transition-colors">Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-white hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-white hover:text-white text-sm transition-colors">Terms of Service</Link></li>
              <li className="text-white text-sm pt-2">
                <a href="mailto:support@rideclub.in" className="hover:text-white transition-colors">support@rideclub.in</a>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-white text-sm">© {new Date().getFullYear()} Ride Club. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );  
};

export default Footer;
