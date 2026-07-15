import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./ConfirmDialog.css";

interface ConfirmContextValue {
    confirm: (message: string, title?: string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [title, setTitle] = useState("Confirm");
    const resolver = useRef<(value: boolean) => void>();

    const confirm = useCallback((msg: string, t = "Confirm") => {
        setMessage(msg);
        setTitle(t);
        setOpen(true);
        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const handleChoice = (value: boolean) => {
        setOpen(false);
        resolver.current?.(value);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {open && (
                    <motion.div
                        className="confirm-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => handleChoice(false)}
                    >
                        <motion.div
                            className="confirm-dialog card"
                            initial={{ opacity: 0, scale: 0.94, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 12 }}
                            transition={{ duration: 0.18 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3>{title}</h3>
                            <p>{message}</p>
                            <div className="confirm-actions">
                                <button type="button" className="btn-secondary" onClick={() => handleChoice(false)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn-danger" onClick={() => handleChoice(true)}>
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
    return ctx.confirm;
}