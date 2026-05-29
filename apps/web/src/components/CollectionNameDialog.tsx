"use client";

import { useEffect, useId, useState } from "react";
import { Icon } from "./Icon";

type CollectionNameDialogProps = {
  open: boolean;
  title: string;
  eyebrow?: string;
  description?: string;
  initialValue?: string;
  submitLabel: string;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (title: string) => void;
  onClose: () => void;
};

export function CollectionNameDialog({
  open,
  title,
  eyebrow = "Collection",
  description,
  initialValue = "",
  submitLabel,
  submitting = false,
  error,
  onSubmit,
  onClose,
}: CollectionNameDialogProps) {
  const inputId = useId();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [initialValue, open]);

  if (!open) {
    return null;
  }

  const trimmedValue = value.trim();

  return (
    <div
      className="collection-name-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby={`${inputId}-title`}
        aria-modal="true"
        className="collection-name-sheet"
        role="dialog"
      >
        <div className="collection-name-head">
          <span className="collection-name-icon">
            <Icon name="edit" size={18} />
          </span>
          <div className="collection-name-heading">
            <p className="eyebrow">{eyebrow}</p>
            <h2 id={`${inputId}-title`}>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button
            aria-label="Close"
            className="collection-name-close"
            disabled={submitting}
            type="button"
            onClick={onClose}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <form
          className="collection-name-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmedValue) {
              onSubmit(trimmedValue);
            }
          }}
        >
          <label className="collection-name-label" htmlFor={inputId}>
            Collection name
          </label>
          <input
            autoComplete="off"
            autoFocus
            className="collection-name-input"
            disabled={submitting}
            id={inputId}
            maxLength={120}
            placeholder="Example: Bridal necklace sets"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          {error ? (
            <p className="collection-name-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="collection-name-actions">
            <button
              className="button secondary"
              disabled={submitting}
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="button gold"
              disabled={!trimmedValue || submitting}
              type="submit"
            >
              <Icon name="check" size={16} />
              {submitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
