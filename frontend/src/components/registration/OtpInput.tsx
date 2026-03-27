// frontend/src/components/OtpInput.tsx
import { useRef, useCallback } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export default function OtpInput({ length = 6, value, onChange, disabled, hasError }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.split('').concat(Array(length).fill('')).slice(0, length);

  const focusInput = (idx: number) => {
    if (idx >= 0 && idx < length) inputsRef.current[idx]?.focus();
  };

  const handleChange = useCallback((idx: number, char: string) => {
    if (char.length > 1) {
      // Paste
      const pasted = char.slice(0, length);
      onChange(pasted);
      focusInput(Math.min(pasted.length, length - 1));
      return;
    }
    const newVal = chars.slice();
    newVal[idx] = char;
    onChange(newVal.join(''));
    if (char) focusInput(idx + 1);
  }, [chars, length, onChange]);

  const handleKeyDown = useCallback((idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !chars[idx]) {
      focusInput(idx - 1);
    }
    if (e.key === 'ArrowLeft') focusInput(idx - 1);
    if (e.key === 'ArrowRight') focusInput(idx + 1);
  }, [chars]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\s/g, '').slice(0, length);
    onChange(pasted);
    focusInput(Math.min(pasted.length, length - 1));
  }, [length, onChange]);

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={c}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          style={{
            width: 44, height: 52, textAlign: 'center',
            fontSize: 20, fontFamily: 'var(--font-mono)', fontWeight: 600,
            borderRadius: 10,
            border: `2px solid ${hasError ? 'var(--color-accent-red)' : (c ? 'var(--color-brand)' : 'var(--color-border-default)')}`,
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)',
            outline: 'none',
            transition: 'border-color 0.2s',
            caretColor: 'var(--color-brand)',
          }}
        />
      ))}
    </div>
  );
}
