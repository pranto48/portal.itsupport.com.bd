import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl p-5 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <Cookie className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground text-sm mb-1">Cookie Notice</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use essential cookies to ensure our site works properly and analytics cookies to understand how you interact with it. Read our{" "}
                  <Link to="/privacy" className="text-primary underline underline-offset-2 hover:text-accent">
                    Privacy Policy
                  </Link>{" "}
                  for more details.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" onClick={accept} className="text-xs h-8 px-4">
                    Accept All
                  </Button>
                  <Button size="sm" variant="outline" onClick={decline} className="text-xs h-8 px-4">
                    Decline
                  </Button>
                </div>
              </div>
              <button onClick={decline} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
