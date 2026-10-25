import { useState, useEffect } from "react";

const Countdown = ({ seconds }: { seconds: number }) => {
  const [remaining, setRemaining] = useState<number>(seconds);

  useEffect(() => {
    let secondsLeft = remaining;
    const interval = setInterval(() => {
      secondsLeft--;
      setRemaining(secondsLeft);
      if (secondsLeft <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span>{remaining}</span>;
};

export default Countdown;