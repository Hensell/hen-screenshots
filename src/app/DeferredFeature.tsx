import {
  Component,
  Suspense,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

/** A failed optional chunk must never unmount the active editor or its unsaved work. */
export class RenderBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function FeatureStatus({
  label,
  failed = false,
  onClose,
}: {
  label: string;
  failed?: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="export-dialog"
      aria-labelledby={heading}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <h2 id={heading}>
        {failed
          ? `Couldn’t open ${label.toLowerCase()}.`
          : `Opening ${label.toLowerCase()}…`}
      </h2>
      <p className="dialog-copy" role={failed ? "alert" : "status"}>
        {failed
          ? "Your project is still open. You can keep editing. Save your changes, then reload the page to try again."
          : "Preparing your tools. Your project stays right here."}
      </p>
      <button className="button secondary full" onClick={onClose}>
        {failed ? "Back to editing" : "Cancel"}
      </button>
    </dialog>
  );
}

export function DeferredFeature({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <RenderBoundary
      fallback={<FeatureStatus label={label} failed onClose={onClose} />}
    >
      <Suspense fallback={<FeatureStatus label={label} onClose={onClose} />}>
        {children}
      </Suspense>
    </RenderBoundary>
  );
}
