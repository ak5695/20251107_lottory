import React from "react";

export const triggerHapticFeedback = (
  type: "light" | "medium" | "heavy" = "light"
) => {
  if ("vibrate" in navigator) {
    switch (type) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(25);
        break;
      case "heavy":
        navigator.vibrate(50);
        break;
    }
  }
};

const useMobileOptimization = () => {
  React.useEffect(() => {
    const addHapticToButtons = () => {
      const buttons = document.querySelectorAll("button");
      buttons.forEach((button) => {
        button.addEventListener(
          "touchstart",
          () => {
            triggerHapticFeedback("light");
          },
          { passive: true }
        );

        const originalClick = button.onclick;
        button.onclick = (e) => {
          triggerHapticFeedback("medium");
          if (originalClick) {
            originalClick.call(button, e);
          }
        };
      });
    };

    setTimeout(addHapticToButtons, 100);

    const observer = new MutationObserver(addHapticToButtons);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);
};

export default useMobileOptimization;
