"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypewriterProps {
    texts: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseDuration?: number;
    className?: string;
    onLoopDone?: () => void;
}

export function Typewriter({
    texts,
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseDuration = 1000,
    className,
    onLoopDone,
}: TypewriterProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [textIndex, setTextIndex] = useState(0);
    const [hasFinished, setHasFinished] = useState(false);

    useEffect(() => {
        if (hasFinished) return;

        const currentText = texts[textIndex];

        const handleTyping = () => {
            if (isDeleting) {
                setDisplayedText((prev) => prev.slice(0, -1));
                if (displayedText.length === 0) {
                    setIsDeleting(false);
                    setTextIndex((prev) => prev + 1);
                }
            } else {
                setDisplayedText(currentText.slice(0, displayedText.length + 1));

                if (displayedText === currentText) {
                    if (textIndex === texts.length - 1) {
                        setHasFinished(true);
                        if (onLoopDone) onLoopDone();
                        return;
                    }

                    setTimeout(() => setIsDeleting(true), pauseDuration);
                    return;
                }
            }
        };

        const timer = setTimeout(
            handleTyping,
            isDeleting ? deletingSpeed : typingSpeed
        );

        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, textIndex, texts, typingSpeed, deletingSpeed, pauseDuration, hasFinished, onLoopDone]);

    return (
        <span className={cn("inline-block", className)}>
            {displayedText}
            <span className="animate-pulse">|</span>
        </span>
    );
}
